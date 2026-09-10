import { ISession } from "../../api/modules/auth/auth.type";
import { env } from "../config/env.config";
import jwtHelper from "../utils/jwt.helper";
import { redisService } from "./redis.service";

class SessionService {
  protected readonly cache = redisService;

  async createSession(
    userId: string,
    role: string,
    email: string | null,
    phoneNumber: string | null,
    userAgent: string | undefined,
    ipAddress: string | undefined,
  ) {
    const { accessToken, refreshToken, jti } =
      jwtHelper.generateAccessAndRefresh({
        id: userId,
        role,
        email,
        phone: phoneNumber,
      });
    const expired = env.SESSION_TTL_SECONDS;

    await this.cache.set(
      `session:${jti}`,
      JSON.stringify({
        id:userId,
        role,
        email,
        phone:phoneNumber,
        userAgent: userAgent || "unknown",
        ipAddress: ipAddress || "unknown",
        valid: true,
      }),
      { ttl: expired },
    );

    return { accessToken, refreshToken, jti, expired };
  }

  async revokeSession(jti: string, ttl?: number) {
    await this.cache.set(`session:${jti}`, JSON.stringify({ valid: false }), {
      ttl: ttl ?? 60 * 60 * 24 * 7,
    });
  }

  async validateSession(jti: string) {
    const session = await this.cache.get(`session:${jti}`);
    return session;
  }

  async updateSession(jti: string, sessionData: ISession) {
    const cacheKey = `session:${jti}`;
    let ttl: number | undefined;

    if (typeof (this.cache as any).getTtl === "function") {
      const expiresAt = await (this.cache as any).getTtl(cacheKey);
      if (expiresAt) {
        ttl = Math.max(1, Math.floor((expiresAt - Date.now()) / 1000));
      }
    } else if (typeof (this.cache as any).ttl === "function") {
      ttl = await (this.cache as any).ttl(cacheKey);
    }
    await this.cache.set(cacheKey, JSON.stringify(sessionData), {
      ttl: ttl ?? 60 * 60 * 24 * 7,
    });
  }
}

export default new SessionService();
