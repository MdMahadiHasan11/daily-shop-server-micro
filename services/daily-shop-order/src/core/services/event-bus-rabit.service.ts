import amqp from "amqplib";
import cuid from "cuid";

import { env } from "../config/env.config";
import { logger } from "../utils/logger.utils";

const EXCHANGE_NAME = "enterprise_exchange";
const EXCHANGE_TYPE = "topic";
const DLX_NAME = "enterprise_dlx";
const MAX_RETRIES = 3;

export interface Event<T = any> {
  id: string;
  name: string;
  timestamp: string;
  correlationId: string;
  origin: string;
  version: number;
  payload: T;
  metadata?: Record<string, any>;
}

type EventHandler<T = any> = (event: Event<T>) => Promise<void> | void;

class EnterpriseEventBus {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;

  private isConnecting = false;
  private reconnectAttempts = 0;

  public async init(): Promise<void> {
    logger.info("🐰 Enterprise EventBus Initializing...");
    await this.connect();
  }

  private async connect(): Promise<void> {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      logger.info("🐰 Connecting RabbitMQ...");

      this.connection = await amqp.connect(env.QUEUE_URL);

      if (!this.connection) {
        throw new Error("Failed to establish RabbitMQ connection");
      }

      this.channel = await this.connection.createChannel();

      // Main exchange
      await this.channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, {
        durable: true,
      });

      // Dead letter exchange
      await this.channel.assertExchange(DLX_NAME, "topic", {
        durable: true,
      });

      this.handleConnectionEvents();

      this.reconnectAttempts = 0;
      this.isConnecting = false;

      logger.info("✅ Enterprise EventBus Connected");
    } catch (error) {
      this.isConnecting = false;
      logger.error({ err: error }, "❌ RabbitMQ connection failed");
      await this.reconnect();
    }
  }

  private async reconnect(): Promise<void> {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * this.reconnectAttempts, 30000);

    logger.warn(`🔁 Reconnecting RabbitMQ in ${delay / 1000}s`);
    setTimeout(() => this.connect(), delay);
  }

  private handleConnectionEvents(): void {
    if (!this.connection) return;

    this.connection.on("close", async () => {
      logger.error("❌ RabbitMQ connection closed");
      this.connection = null;
      this.channel = null;
      await this.reconnect();
    });

    this.connection.on("error", (err: any) => {
      logger.error({ err }, "🐰 RabbitMQ error");
    });
  }

  // ✅ 1. Standard Event Publish
  public async publish<T = any>(
    eventName: string,
    payload: T,
    metadata?: {
      correlationId?: string;
      origin?: string;
      version?: number;
      [key: string]: any;
    },
  ): Promise<Event<T>> {
    try {
      if (!this.channel) {
        await this.connect();
      }

      if (!this.channel) {
        throw new Error("RabbitMQ channel unavailable");
      }

      const event: Event<T> = {
        id: cuid(),
        name: eventName,
        timestamp: new Date().toISOString(),
        correlationId: metadata?.correlationId || cuid(),
        origin: metadata?.origin || "unknown",
        version: metadata?.version || 1,
        payload,
        metadata,
      };

      const success = this.channel.publish(
        EXCHANGE_NAME,
        eventName,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
          contentType: "application/json",
          messageId: event.id,
          correlationId: event.correlationId,
          timestamp: Date.now(),
        },
      );

      if (!success) {
        throw new Error("Publish failed");
      }

      logger.info(`📤 Event Published: ${eventName}`);
      return event;
    } catch (error) {
      logger.error({ err: error }, "❌ Event publish failed");
      throw error;
    }
  }

  // ✅ 2. STEP ADDED: Delayed / Expired Event Publish (e.g., 2 minutes delay)
  public async publishDelayed<T = any>(
    eventName: string,
    payload: T,
    delayInMs: number, // Milliseconds (e.g., 2 mins = 120000 ms)
    metadata?: {
      correlationId?: string;
      origin?: string;
      version?: number;
      [key: string]: any;
    },
  ): Promise<Event<T>> {
    try {
      if (!this.channel) {
        await this.connect();
      }

      if (!this.channel) {
        throw new Error("RabbitMQ channel unavailable");
      }

      const event: Event<T> = {
        id: cuid(),
        name: eventName,
        timestamp: new Date().toISOString(),
        correlationId: metadata?.correlationId || cuid(),
        origin: metadata?.origin || "delayed_publisher",
        version: metadata?.version || 1,
        payload,
        metadata,
      };

      // Create a temporary queue with TTL that forwards to main exchange upon expiration
      const delayedQueue = `delayed.${eventName}.${delayInMs}.queue`;

      await this.channel.assertQueue(delayedQueue, {
        durable: true,
        messageTtl: delayInMs, // ⏳ Delay time in ms
        deadLetterExchange: EXCHANGE_NAME, // 🎯 Target Exchange when expired
        deadLetterRoutingKey: eventName, // 🎯 Target Routing Key
      });

      this.channel.sendToQueue(
        delayedQueue,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
          messageId: event.id,
          correlationId: event.correlationId,
        },
      );

      logger.info(
        `⏳ Delayed Event Queued: ${eventName} (Triggers in ${delayInMs / 1000}s)`,
      );
      return event;
    } catch (error) {
      logger.error({ err: error }, "❌ Delayed event publish failed");
      throw error;
    }
  }

  // ✅ 3. Event Subscriber
  public async subscribe<T = any>(
    eventName: string,
    handler: EventHandler<T>,
    subscriberGroup = "default_service",
  ): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }

    if (!this.channel) {
      throw new Error("RabbitMQ channel unavailable");
    }

    const queueName = `${subscriberGroup}.${eventName}.queue`;
    const retryQueue = `${subscriberGroup}.${eventName}.retry.queue`;
    const deadLetterQueue = `${subscriberGroup}.${eventName}.dlq`;

    await this.channel.assertQueue(queueName, {
      durable: true,
      deadLetterExchange: DLX_NAME,
      deadLetterRoutingKey: deadLetterQueue,
    });

    await this.channel.assertQueue(retryQueue, {
      durable: true,
      messageTtl: 5000,
      deadLetterExchange: EXCHANGE_NAME,
      deadLetterRoutingKey: eventName,
    });

    await this.channel.assertQueue(deadLetterQueue, {
      durable: true,
    });

    await this.channel.bindQueue(queueName, EXCHANGE_NAME, eventName);
    await this.channel.bindQueue(deadLetterQueue, DLX_NAME, deadLetterQueue);

    await this.channel.consume(
      queueName,
      async (msg) => {
        if (!msg) return;

        try {
          const event: Event<T> = JSON.parse(msg.content.toString());

          logger.info(`📥 Event Received: ${event.name}`);
          await handler(event);

          this.channel?.ack(msg);
          logger.info(`✅ Event Processed: ${event.name}`);
        } catch (error) {
          const retryCount =
            Number(msg.properties.headers?.["x-retry-count"]) || 0;

          logger.error(
            { err: error },
            `❌ Event Handler Failed (${retryCount})`,
          );

          if (retryCount < MAX_RETRIES) {
            this.channel?.sendToQueue(retryQueue, msg.content, {
              persistent: true,
              headers: {
                "x-retry-count": retryCount + 1,
              },
            });

            logger.warn(`🔁 Retry queued (${retryCount + 1})`);
          } else {
            this.channel?.publish(DLX_NAME, deadLetterQueue, msg.content, {
              persistent: true,
            });

            logger.error(`☠️ Moved to DLQ: ${eventName}`);
          }

          this.channel?.ack(msg);
        }
      },
      { noAck: false },
    );

    logger.info(`📥 Subscribed: ${queueName}`);
  }

  public async healthCheck() {
    return {
      healthy: !!this.connection && !!this.channel,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  public async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      logger.warn("🛑 EventBus Closed");
    } catch (error) {
      logger.error({ err: error }, "❌ EventBus close failed");
    }
  }
}

export const eventBus = new EnterpriseEventBus();
