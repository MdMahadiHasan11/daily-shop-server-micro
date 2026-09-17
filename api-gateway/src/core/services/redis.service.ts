import Redis, { RedisOptions } from "ioredis";
import { env } from "../../config/gateway.config";
import { logger } from "../../utils/logger.utils";

const redisConfig: RedisOptions = {
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
  reconnectOnError: (err: any) => {
    const targetErrors = ["READONLY", "ECONNRESET"];
    return targetErrors.some((e) => err.message.includes(e));
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
};

const redis = new Redis(env.REDIS_URL, redisConfig);

redis.on("connect", () => logger.info("[Redis] Connected successfully"));
redis.on("error", (err: any) =>
  logger.error({ err }, "[Redis] Error encountered"),
);
redis.on("close", () => logger.warn("[Redis] Connection closed"));

export interface CacheSetOptions {
  ttl?: number;
  namespace?: string;
  onlyIfNew?: boolean;
}

export interface CacheKeyOptions {
  namespace?: string;
}
class RedisService {
  private readonly defaultTTL = 3600;
  private readonly maxValueSizeBytes = 1024 * 1024;

  public get client(): Redis {
    return redis;
  }

  async set<T = unknown>(
    key: string,
    value: T,
    options: CacheSetOptions = {},
  ): Promise<boolean> {
    const fullKey = this.buildKey(key, options.namespace);
    try {
      const serialized = this.serialize(value);
      this.validateSize(serialized);

      const ttl = options.ttl ?? this.defaultTTL;
      const args: (string | number)[] = [];

      if (ttl > 0) args.push("EX", ttl);
      if (options.onlyIfNew) args.push("NX");

      const result = await redis.set(fullKey, serialized, ...(args as any));
      return result === "OK";
    } catch (error) {
      this.handleError("set", error, { key: fullKey });
      return false;
    }
  }

  async get<T = unknown>(
    key: string,
    options: CacheKeyOptions = {},
  ): Promise<T | null> {
    const fullKey = this.buildKey(key, options.namespace);
    try {
      const data = await redis.get(fullKey);
      if (data === null) return null;
      return this.deserialize<T>(data);
    } catch (error) {
      this.handleError("get", error, { key: fullKey });
      return null;
    }
  }

  async delete(
    pattern: string,
    options: CacheKeyOptions = {},
  ): Promise<number> {
    const fullPattern = this.buildKey(pattern, options.namespace);
    try {
      const keys = await this.scanKeys(fullPattern);
      if (keys.length === 0) return 0;

      const chunkSize = 500;
      let totalDeleted = 0;

      for (let i = 0; i < keys.length; i += chunkSize) {
        const batch = keys.slice(i, i + chunkSize);
        totalDeleted += await redis.del(...batch);
      }
      return totalDeleted;
    } catch (error) {
      this.handleError("delete", error, { pattern: fullPattern });
      return 0;
    }
  }

  async flush(namespace?: string): Promise<boolean> {
    try {
      if (namespace) {
        await this.delete("*", { namespace });
      } else {
        await redis.flushdb();
      }
      return true;
    } catch (error) {
      this.handleError("flush", error, { namespace });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await redis.quit();
    } catch (error) {
      logger.error(
        { error },
        "Error gracefully quitting Redis, forcing disconnect",
      );
      redis.disconnect();
    }
  }

  private buildKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    let cursor = "0";
    const foundKeys: string[] = [];

    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );
      cursor = nextCursor;
      foundKeys.push(...keys);
    } while (cursor !== "0");

    return foundKeys;
  }

  private serialize<T>(value: T): string {
    return typeof value === "string" ? value : JSON.stringify(value);
  }

  private deserialize<T>(value: string): T {
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  private validateSize(serialized: string): void {
    if (Buffer.byteLength(serialized, "utf8") > this.maxValueSizeBytes) {
      throw new Error(
        `Value exceeds maximum allowed size of ${this.maxValueSizeBytes} bytes`,
      );
    }
  }

  private handleError(
    operation: string,
    error: unknown,
    context: Record<string, unknown> = {},
  ): void {
    logger.error(
      {
        operation,
        ...context,
        error: error instanceof Error ? error.message : error,
      },
      `Redis operation [${operation}] failed`,
    );
  }
}

export const redisService = new RedisService();
