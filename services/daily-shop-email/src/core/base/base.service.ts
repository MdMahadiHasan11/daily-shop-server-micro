import cuid from "cuid";
import { performance } from "perf_hooks";
import { AppError, ErrorThrower } from "../errors/errors";
import db from "../lib/prisma";
import { eventBus } from "../services/event-bus-rabit.service";

import { logger } from "../utils/logger.utils";

export abstract class BaseService {
  // ✅ Prisma client instance from your DatabaseService wrapper
  protected readonly db = db.prisma;
  protected readonly eventBus = eventBus;

  protected serviceName: string = this.constructor.name;
  private readonly startupTime = Date.now();

  async healthCheck() {
    const checks = {
      database: await this._checkDatabase(),
      eventBus: await this.eventBus.healthCheck(),
      uptime: process.uptime(),
      serviceUptime: (Date.now() - this.startupTime) / 1000,
    };

    const healthy = Object.values(checks).every((check) =>
      typeof check === "object" && check !== null && "healthy" in check
        ? check.healthy !== false
        : true,
    );

    return {
      healthy,
      ...checks,
      timestamp: new Date().toISOString(),
    };
  }

  private async _checkDatabase() {
    try {
      const start = performance.now();
      // ✅ Type casting to safely run $queryRaw without type mismatch errors
      await (this.db as any).$queryRaw`SELECT 1`;

      return {
        healthy: true,
        latency: Number((performance.now() - start).toFixed(2)),
      };
    } catch (error: any) {
      return {
        healthy: false,
        error: error.message || "Database connection error",
      };
    }
  }

  protected _handleError(
    error: unknown,
    context?: string,
    metadata?: Record<string, any>,
  ) {
    // ✅ Fixed Pino Logger overload signature: Pass object first, then string message
    logger.error(
      { err: error, context, ...metadata },
      `[${this.serviceName}] Operation failed`,
    );
  }

  protected async executeCommand(
    commandName: string,
    payload: any,
    metadata?: Record<string, any>,
  ) {
    return {
      id: cuid(),
      name: commandName,
      timestamp: new Date().toISOString(), // ✅ String ISO format for eventBus compatibility
      origin: this.serviceName,
      payload,
      metadata,
    };
  }

  async shutdown() {
    logger.info(`Shutting down ${this.serviceName}`);
  }

  appError = AppError;
  throwNotFound = ErrorThrower.notFound;
  throwValidation = ErrorThrower.validation;
  throwUnHandle = ErrorThrower.unhandled;
  throwUnauthorized = ErrorThrower.unauthorized;
}
