import { env } from "./env.config";

import rateLimit from "express-rate-limit";

export const authConfig = {
  jwt: {
    secret: env.JWT_SECRET,
    accessExpiry: env.JWT_ACCESS_EXPIRATION || "15m",
    refreshExpiry: env.JWT_REFRESH_EXPIRATION || "7d",
    issuer: "holidays-accounting-app",
  },
  cookies: {
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    httpOnly: true,
  },
  apiLimiter: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 500, // max requests per IP
    standardHeaders: true,
    legacyHeaders: false,
  }),
  authLimiter: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 90, // only 5 attempts per minute
    standardHeaders: true,
    legacyHeaders: false,
  }),
};
