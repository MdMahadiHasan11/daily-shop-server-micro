import cors from "cors";
import helmet from "helmet";

import { env } from "../../core/config/env.config";

export const securityMiddleware = [
  helmet(),
  cors({
    origin: env.ALLOWED_ORIGINS?.split(",") || true,
    credentials: true,
  }),
];
