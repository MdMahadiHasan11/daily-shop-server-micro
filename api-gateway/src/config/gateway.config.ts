import * as dotenv from "dotenv";
import { cleanEnv, num, str } from "envalid";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger.utils";

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
  PORT: num({ default: 5000 }),
  ALLOWED_ORIGINS: str(),

  AUTH_SERVICE: str(),
  USER_SERVICE: str(),
  MESSAGE_SERVICE: str(),

  // secret
  GATEWAY_SECRET: str(),
  JWT_PUBLIC_KEY: str(),
});

export type Env = typeof env;
