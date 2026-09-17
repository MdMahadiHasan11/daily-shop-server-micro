import * as dotenv from "dotenv";
import { cleanEnv, makeValidator, num, str, url } from "envalid";
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

const currencyValidator = makeValidator<string>((input: string) => {
  const validCurrencies = ["BDT", "USD", "EUR", "GBP", "INR", "CAD", "AUD"];
  if (validCurrencies.includes(input)) return input;
  throw new Error(`Must be one of: ${validCurrencies.join(", ")}`);
});

const dateFormatValidator = makeValidator<string>((input: string) => {
  if (/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(input)) return input;
  throw new Error("Format must be MM-DD");
});

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "test", "staging", "production"],
    default: "development",
  }),
  DATABASE_URL: str(),
  PORT: num({ default: 5010 }),
  ALLOWED_ORIGINS: str(),
  REDIS_URL: str(),

  INVENTORY_SERVICE_URL: str(),
  QUEUE_URL: url({ default: "" }),

  // Authentication
  JWT_SECRET: str(),
  JWT_ACCESS_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  JWT_EXPIRATION: str({ default: "7d" }),
  JWT_ACCESS_EXPIRATION: str({ default: "7d" }),
  JWT_REFRESH_EXPIRATION: str({ default: "30d" }),
  JWT_PRIVATE_KEY: str(),
  JWT_PUBLIC_KEY: str(),

  OTP_TTL_SECONDS: num({ default: 30 }),
  SESSION_TTL_SECONDS: num({ default: 604800 }),

  COOKIE_ACCESS_TOKEN_MAX_AGE_DAYS: num({ default: 1 }),
  COOKIE_REFRESH_TOKEN_MAX_AGE_DAYS: num({ default: 7 }),

  //   SMTP_EMAIL: email(),
  DEFAULT_CURRENCY: currencyValidator(),
  FISCAL_YEAR_START: dateFormatValidator(),
  AUTH_INTERNAL_SECRET: str(),

  USER_SERVICE_URL: str(),
  GATEWAY_SECRET: str(),
});

export type Env = typeof env;
