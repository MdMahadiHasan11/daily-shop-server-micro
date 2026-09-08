import app from "./app";
import { env } from "./config/gateway.config";

import { logger } from "./utils/logger.utils";

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 API Gateway running on http://localhost:${env.PORT}`);
});

const exitHandler = (signal: string) => {
  logger.warn(`🛑 Shutdown initiated by: ${signal}`);
  if (server) {
    server.close(() => {
      logger.info("HTTP Server closed safely.");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", () => exitHandler("SIGINT"));
process.on("SIGTERM", () => exitHandler("SIGTERM"));

process.on("uncaughtException", (err) => {
  logger.error({ err }, "💥 UNCAUGHT EXCEPTION");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "💥 UNHANDLED REJECTION");
  process.exit(1);
});
