import Redis, { RedisOptions } from "ioredis";
import { env } from "../config/env.config";
import { logger } from "../utils/logger.utils";

export type KeyExpirationCallback = (
  key: string,
  keyParts: string[],
) => Promise<void> | void;

export class RedisSubscriberService {
  private subscriber: Redis;
  private isListening = false;
  private readonly handlers: Map<string, KeyExpirationCallback> = new Map();

  constructor() {
    const redisConfig: RedisOptions = {
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
      reconnectOnError: (err) => {
        const targetErrors = ["READONLY", "ECONNRESET"];
        return targetErrors.some((e) => err.message.includes(e));
      },
      maxRetriesPerRequest: null,
    };

    // Redis requires a separate dedicated connection for Pub/Sub subscriptions
    this.subscriber = new Redis(env.REDIS_URL, redisConfig);
    this.setupListeners();
  }

  /**
   * Register an event callback for keys expiring under a specific namespace prefix.
   * Example: namespace 'cart' will trigger for keys like 'cart:reservation:item123:2'
   */
  public onKeyExpired(
    namespace: string,
    callback: KeyExpirationCallback,
  ): void {
    if (this.handlers.has(namespace)) {
      logger.warn(
        `[RedisSubscriber] Overwriting handler for namespace: "${namespace}"`,
      );
    }
    this.handlers.set(namespace, callback);
  }

  /**
   * Initializes Redis keyspace events configuration and starts listening.
   */
  public async start(): Promise<void> {
    if (this.isListening) return;

    try {
      // Enable Keyspace Notifications for Expired ("Ex") events on Redis server
      await this.subscriber.config("SET", "notify-keyspace-events", "Ex");

      // Subscribe to expired key event patterns (Database 0 by default)
      await this.subscriber.psubscribe("__keyevent@0__:expired");
      this.isListening = true;

      logger.info(
        "[RedisSubscriber] Started listening for key expiration events",
      );
    } catch (error) {
      logger.error(
        { error },
        "[RedisSubscriber] Failed to initialize keyspace subscriber",
      );
    }
  }

  private setupListeners(): void {
    this.subscriber.on("pmessage", (_pattern, _channel, expiredKey: string) => {
      this.dispatchExpirationEvent(expiredKey);
    });

    this.subscriber.on("error", (err) => {
      logger.error({ err }, "[RedisSubscriber] Subscriber connection error");
    });
  }

  private async dispatchExpirationEvent(fullKey: string): Promise<void> {
    const keyParts = fullKey.split(":");
    const namespace = keyParts[0];

    const handler = this.handlers.get(namespace);
    if (!handler) return;

    try {
      await handler(fullKey, keyParts);
    } catch (error) {
      logger.error(
        { error, fullKey },
        `[RedisSubscriber] Error processing expiration logic for namespace "${namespace}"`,
      );
    }
  }

  public async disconnect(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.quit();
      this.isListening = false;
      logger.info("[RedisSubscriber] Connection closed cleanly");
    }
  }
}

export const redisSubscriberService = new RedisSubscriberService();
