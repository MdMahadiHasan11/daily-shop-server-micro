import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { env } from "../config/env.config";
import { logger } from "../utils/logger.utils";

declare global {
  var databaseService: DatabaseService | undefined;
}

class DatabaseService {
  public readonly prisma: PrismaClient;
  private readonly pool: Pool;
  private initialized = false;

  constructor() {
    this.pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    const adapter = new PrismaPg(this.pool);

    this.prisma = new PrismaClient({
      adapter,
      log:
        env.NODE_ENV === "development"
          ? [
              { emit: "event", level: "query" },
              { emit: "event", level: "info" },
              { emit: "event", level: "warn" },
              { emit: "event", level: "error" },
            ]
          : [{ emit: "event", level: "error" }],
    });

    this.setupLogging();
  }

  public async init(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.prisma.$connect();
      this.initialized = true;
      logger.info("🗄️ Database Service initialized with PgAdapter");
    } catch (error) {
      logger.error(
        error,
        "❌ Database connection failed during initialization",
      );
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      await this.pool.end();
      logger.info("🗄️ Database pool closed safely");
    } catch (error) {
      logger.error(error, "⚠️ Error during database disconnect");
    }
  }

  private setupLogging(): void {
    if (env.NODE_ENV !== "development") return;

    const prismaEmitter = this.prisma as any;

    prismaEmitter.$on("query", (e: any) => {
      logger.info(
        { query: e.query, duration: `${e.duration}ms` },
        "📝 Prisma Query",
      );
    });

    prismaEmitter.$on("info", (e: any) => logger.info(e.message));
    prismaEmitter.$on("warn", (e: any) => logger.warn(e.message));
    prismaEmitter.$on("error", (e: any) => logger.error(e.message));
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (err) {
      logger.error(err, "💥 Database Health check failed");
      return false;
    }
  }

  public async withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 200,
  ): Promise<T> {
    let lastError: unknown;

    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        logger.warn(`⚠️ DB Query failed. Retrying... (${i + 1}/${retries})`);
        await new Promise((r) => setTimeout(r, delay * (i + 1)));
      }
    }

    throw lastError;
  }
}

const db = global.databaseService || new DatabaseService();

if (env.NODE_ENV !== "production") {
  global.databaseService = db;
}

export default db;
export { DatabaseService };
