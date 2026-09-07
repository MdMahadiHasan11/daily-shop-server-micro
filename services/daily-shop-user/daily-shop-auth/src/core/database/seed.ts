// src/core/database/seed.ts
import db from "../lib/prisma";
import { logger } from "../utils/logger.utils";

async function runSeeds() {
  await db.prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      id: "1",
      email: "admin@gmail.com",
      name: "Super Admin",
    },
  });

  logger.info("🌱 Database records inserted successfully");
}

async function bootstrap() {
  try {
    await db.init();
    await runSeeds();

    logger.info("🎉 ALL SEEDS COMPLETED");
  } catch (error) {
    logger.error(error, "❌ Seed execution failed");
    process.exitCode = 1;
  } finally {
    try {
      await db.disconnect();
      logger.info("🗄️ Database disconnected after seeding");
    } catch (disError) {
      logger.error(disError, "⚠️ Error during database disconnect");
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    process.exit(process.exitCode || 0);
  }
}

bootstrap();
