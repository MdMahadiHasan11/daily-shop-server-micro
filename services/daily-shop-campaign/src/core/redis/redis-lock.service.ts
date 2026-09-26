import { redisService } from "../services/redis.service";

export class RedisLockService {
  public static async acquireLock(
    lockKey: string,
    ttlSeconds = 15,
  ): Promise<boolean> {
    const fullKey = `lock:${lockKey}`;
    // SET lockKey "locked" EX ttlSeconds NX
    const result = await redisService.client.set(
      fullKey,
      "locked",
      "EX",
      ttlSeconds,
      "NX",
    );
    return result === "OK";
  }

  public static async releaseLock(lockKey: string): Promise<void> {
    await redisService.delete(`lock:${lockKey}`);
  }
}
