import rateLimit from "express-rate-limit";

export const authConfig = {
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
