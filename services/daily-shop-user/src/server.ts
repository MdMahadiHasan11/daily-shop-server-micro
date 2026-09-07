import app from "./app";
import { bootstrapListeners } from "./bootstrap/listeners.bootstrap";

import { env } from "./core/config/env.config";
import db from "./core/lib/prisma";
import { eventBus } from "./core/services/event-bus-rabit.service";
import { metrics } from "./core/services/metrics.service";
import { redisSubscriberService } from "./core/services/redis-subscriber.service";
import { redisService } from "./core/services/redis.service";
import { logger } from "./core/utils/logger.utils";

const PORT = env.PORT || 5011;

// Metrics interval
const metricsInterval = setInterval(() => {
  const memory = process.memoryUsage();

  metrics.memoryUsage.set({ type: "rss" }, memory.rss);
  metrics.memoryUsage.set({ type: "heapUsed" }, memory.heapUsed);
  metrics.memoryUsage.set({ type: "external" }, memory.external);
}, 5000);

const initServices = async () => {
  try {
    await db.init();
    logger.info("⚙️ Database initialized");

    await redisService.healthCheck();

    // ✅ Initialize RabbitMQ EventBus Connection
    await eventBus.init();

    await bootstrapListeners();
    logger.info("🔔 Redis Expiration & EventBus Listeners initialized");
  } catch (err) {
    logger.error({ err }, "❌ Service initialization failed");
    process.exit(1);
  }
};

async function startServer() {
  try {
    await initServices();

    const server = app.listen(PORT, () => {
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
    });

    // 🛑 Safe Graceful Shutdown Handler
    const exitHandler = (signal: string) => {
      logger.warn(`🛑 Shutdown initiated by: ${signal}`);
      clearInterval(metricsInterval);

      if (server) {
        server.close(async () => {
          logger.info("HTTP Server closed. Closing connections...");

          try {
            // ✅ Safely disconnect EventBus along with DB and Redis
            await Promise.all([
              db.disconnect(),
              redisService.disconnect(),
              redisSubscriberService.disconnect(),
              eventBus.close(), // ✅ EventBus connection close
            ]);

            logger.info(
              "👋 All connections (DB, Redis, Subscriber & EventBus) closed safely",
            );
            process.exit(0);
          } catch (error) {
            logger.error(
              { error },
              "Error during database/redis/eventbus disconnection",
            );
            process.exit(1);
          }
        });
      } else {
        process.exit(0);
      }
    };

    process.on("SIGINT", () => exitHandler("SIGINT (Ctrl+C)"));
    process.on("SIGTERM", () => exitHandler("SIGTERM"));
  } catch (error) {
    logger.error({ error }, "💥 Failed to start server:");
    process.exit(1);
  }
}

// Global Error Handlers
process.on("uncaughtException", (err) => {
  logger.error({ err }, "💥 UNCAUGHT EXCEPTION");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "💥 UNHANDLED REJECTION");
  process.exit(1);
});

startServer();
