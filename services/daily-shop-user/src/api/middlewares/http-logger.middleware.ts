import { NextFunction, Request, Response } from "express";
import { env } from "../../core/config/env.config";
import { logger } from "../../core/utils/logger.utils";

export const httpLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (env.NODE_ENV === "production") {
    return next();
  }

  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    const logPayload = {
      ip: req.ip || req.socket.remoteAddress,
      method: req.method,
      path: req.originalUrl,
      status: statusCode,
      duration: `${duration}ms`,
    };

    if (statusCode >= 500) {
      logger.error(logPayload, "💥 HTTP Request Failed (Server Error)");
    } else if (statusCode >= 400) {
      logger.warn(logPayload, "⚠️ HTTP Request Failed (Client Error)");
    } else {
      logger.info(logPayload, "📝 HTTP Request Processed");
    }
  });

  return next();
};
