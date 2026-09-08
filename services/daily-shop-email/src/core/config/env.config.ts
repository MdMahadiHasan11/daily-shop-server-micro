import * as dotenv from "dotenv";
import { cleanEnv, makeValidator, num, str, url } from "envalid";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger.utils";

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
  PORT: num({ default: 5050 }),
  ALLOWED_ORIGINS: str(),
  REDIS_URL: str(),
  QUEUE_URL: url({ default: "" }),

  //service to secret
  USER_SECRET: str(),
  GATEWAY_SECRET: str(),
  AUTH_SECRET: str(),
  EMAIL_SECRET: str(),
});

export type Env = typeof env;
