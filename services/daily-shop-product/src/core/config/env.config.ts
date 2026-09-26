import * as dotenv from "dotenv";
import { cleanEnv, num, str, url } from "envalid";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger.utils";
dotenv.config();
// 1. Determine and Load Environment File Dynamically
const nodeEnv = process.env.NODE_ENV || "development";
const envFileName = `.env.${nodeEnv}`;
const envPath = path.join(process.cwd(), envFileName);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  logger.info(`🌐 Environment loaded configuration: [${envFileName}]`);
} else {
  logger.warn(
    `⚠️  ${envFileName} file not found. Falling back to default .env`,
  );
  dotenv.config();
}

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "test", "staging", "production"],
    default: "development",
  }),
  DATABASE_URL: str(),
  PORT: num({ default: 5011 }),
  ALLOWED_ORIGINS: str(),
  REDIS_URL: str(),
  QUEUE_URL: url({ default: "" }),

  SESSION_TTL_SECONDS: num({ default: 604800 }),

  EMAIL_SECRET: str(),
  GATEWAY_SECRET: str(),
  PRODUCT_INTERNAL_SECRET: str(),
  CART_SECRET: str(),
  ORDER_SECRET: str(),

  INVENTORY_SERVICE_URL: str(),
  CAMPAIGN_SECRET: str(),
});

export type Env = typeof env;
