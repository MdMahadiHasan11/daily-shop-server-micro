import cors from "cors";
import helmet from "helmet";

import { authConfig } from "../../core/config/auth.config";
import { env } from "../../core/config/env.config";

export const securityMiddleware = [
  helmet(),
  authConfig.apiLimiter,
  cors({
    origin: env.ALLOWED_ORIGINS?.split(",") || true,
    credentials: true,
  }),
];
