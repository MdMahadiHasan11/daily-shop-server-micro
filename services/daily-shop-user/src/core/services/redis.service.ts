import Redis, { RedisOptions } from "ioredis";
import { env } from "../config/env.config";
import { throwValidation } from "../errors/errors";
import { logger } from "../utils/logger.utils";

// --- Configuration & Initialization ---
const redisConfig: RedisOptions = {
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
  reconnectOnError: (err) => {
    const targetErrors = ["READONLY", "ECONNRESET"];
    return targetErrors.some((e) => err.message.includes(e));
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
};

const redis = new Redis(env.REDIS_URL, redisConfig);

redis.on("connect", () => logger.info("[Redis] Connected successfully"));
redis.on("error", (err) => logger.error({ err }, "[Redis] Error encountered"));
redis.on("close", () => logger.warn("[Redis] Connection closed"));

// --- Service Options Types ---
export interface CacheSetOptions {
  ttl?: number;
  namespace?: string;
  onlyIfNew?: boolean;
}

export interface CacheKeyOptions {
  namespace?: string;
}

export interface CacheIncrementOptions extends CacheKeyOptions {
  by?: number;
  ttl?: number;
}

// --- Service Implementation ---
export class RedisService {
  private readonly defaultTTL = 3600; // 1 hour (seconds)
  private readonly maxValueSizeBytes = 1024 * 1024; // 1MB

  /**
   * Return internal ioredis instance
   */
  public get client(): Redis {
    return redis;
  }

  /**
   * Set a key-value pair with optional TTL and conditional checks
   */
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

  /**
   * Get and deserialize a key value
   */
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

  /**
   * Delete specific key or matching pattern safely via SCAN
   */
  async delete(
    pattern: string,
    options: CacheKeyOptions = {},
  ): Promise<number> {
    const fullPattern = this.buildKey(pattern, options.namespace);

    try {
      const keys = await this.scanKeys(fullPattern);
      if (keys.length === 0) return 0;

      // Delete in chunks to prevent argument length limits
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

  /**
   * Atomic increment with optional TTL application
   */
  async increment(
    key: string,
    options: CacheIncrementOptions = {},
  ): Promise<number | null> {
    const fullKey = this.buildKey(key, options.namespace);

    try {
      const result = await redis.incrby(fullKey, options.by ?? 1);

      if (options.ttl) {
        await redis.expire(fullKey, options.ttl);
      }

      return result;
    } catch (error) {
      this.handleError("increment", error, { key: fullKey });
      return null;
    }
  }

  /**
   * Retrieve all matching keys safely using SCAN (Non-blocking)
   */
  async getAllKeys(namespace?: string): Promise<string[]> {
    const pattern = namespace ? `${namespace}:*` : "*";
    try {
      return await this.scanKeys(pattern);
    } catch (error) {
      this.handleError("getAllKeys", error, { namespace });
      return [];
    }
  }

  /**
   * Flush all keys or keys restricted to a specific namespace
   */
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

  /**
   * Health check for system monitoring
   */
  async healthCheck() {
    try {
      const start = performance.now();
      await redis.ping();
      return {
        healthy: true,
        latencyMs: Number((performance.now() - start).toFixed(2)),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Gracefully close Redis connection
   */
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

  // --- Private Utilities ---

  private buildKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  /**
   * Non-blocking cursor key scanner to replace dangerous `KEYS` command
   */
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
      throwValidation(
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

export enum RedisErrorCodes {
  CONNECTION_REFUSED = "ECONNREFUSED",
  MAX_RETRIES = "MAX_RETRIES_PER_REQUEST_FAILED",
  NO_AUTH = "NOAUTH",
  BUSY = "BUSY",
}
