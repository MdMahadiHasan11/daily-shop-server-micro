import Redis from "ioredis";
import { logger } from "../utils/logger.utils";

export class RedisExpiredSubscriber {
  private subscriberClient: Redis;
  private handlers: Map<string, (id: string) => Promise<void>> = new Map();

  constructor(redisUrl: string) {
    this.subscriberClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }

  // কোন Key Prefix এর জন্য কোন হ্যান্ডলার চলবে তা রেজিস্টার করা
  public registerHandler(
    prefix: string,
    handler: (id: string) => Promise<void>,
  ): void {
    this.handlers.set(prefix, handler);
  }

  // Expired Event Listen করা
  public async listen(): Promise<void> {
    const channel = "__keyevent@0__:expired";

    // Redis-এ Expired Events এনাবল করা
    await this.subscriberClient.config("SET", "notify-keyspace-events", "Ex");
    await this.subscriberClient.subscribe(channel);

    logger.info(
      `[Subscriber] Listening to expired keys on channel: ${channel}`,
    );

    this.subscriberClient.on("message", async (_, expiredKey: string) => {
      await this.processExpiredKey(expiredKey);
    });
  }

  private async processExpiredKey(fullKey: string): Promise<void> {
    // Key Format: "cart:timer:CART_123"
    const parts = fullKey.split(":");
    if (parts.length < 3) return;

    const prefix = `${parts[0]}:${parts[1]}`; // "cart:timer"
    const id = parts.slice(2).join(":"); // "CART_123"

    const handler = this.handlers.get(prefix);
    if (handler) {
      try {
        await handler(id);
      } catch (error) {
        logger.error(
          { error, fullKey },
          "[Subscriber] Error executing handler",
        );
      }
    }
  }

  public async disconnect(): Promise<void> {
    await this.subscriberClient.quit();
    logger.info("[Subscriber] Connection closed gracefully");
  }
}
