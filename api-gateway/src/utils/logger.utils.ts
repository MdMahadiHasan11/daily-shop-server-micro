import { existsSync, mkdirSync } from "fs";
import path from "path";
import pino, { DestinationStream, LoggerOptions } from "pino";

const isDev = process.env.NODE_ENV === "development";
const logDir = path.join(process.cwd(), "logs");

// Ensure log directory exists
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

const streams: Array<{ stream: DestinationStream | NodeJS.WriteStream }> = [];

if (isDev) {
  streams.push({
    stream: pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    }),
  });
} else {
  streams.push(
    { stream: process.stdout },
    {
      stream: pino.destination({
        dest: path.join(logDir, "app.log"),
        sync: false,
      }),
    },
  );
}

const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  base: isDev ? undefined : { env: process.env.NODE_ENV },
};

export const logger = pino(loggerOptions, pino.multistream(streams));
