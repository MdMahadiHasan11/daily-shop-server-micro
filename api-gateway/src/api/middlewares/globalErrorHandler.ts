import axios from "axios";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../../errors/errors";

/**
 * GLOBAL ERROR HANDLER FOR API GATEWAY (MUST BE LAST MIDDLEWARE)
 */
export const globalErrorHandler = async (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let error: any = err;

  // ===============================
  // LOG ERROR FOR DEBUGGING
  // ===============================
  console.error("🔥 GATEWAY ERROR:", {
    path: req.originalUrl,
    method: req.method,
    message: error?.message || error,
  });

  // ===============================
  // CUSTOM APP ERROR
  // ===============================
  if (error instanceof AppError) {
    return sendErrorResponse(error, req, res);
  }

  // ===============================
  // UNKNOWN OR FALLBACK ERROR
  // ===============================
  const fallbackError = new AppError(
    "API Gateway Internal Error",
    500,
    false,
    error instanceof Error ? error.message : error,
    "GATEWAY_INTERNAL_ERROR",
  );

  return sendErrorResponse(fallbackError, req, res);
};

const sendErrorResponse = (err: AppError, req: Request, res: Response) => {
  const isDev = process.env.NODE_ENV !== "production";

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
    code: err.code,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,

    ...(err.details && { details: err.details }),

    ...(isDev && {
      stack: err.stack,
      context: err.context,
    }),
  });
};

/**
 * HANDLE AXIOS ERRORS FOR MICROSERVICES COMMUNICATION
 */
export const handleAxiosError = (
  error: unknown,
  defaultMessage = "Inter-service communication failed",
): never => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 502;
    const errorData: any = error.response?.data;

    const message = errorData?.message || errorData?.error || defaultMessage;

    throw new AppError(
      message,
      status,
      true,
      (errorData?.details || errorData?.stack) as any,
      errorData?.code || "INTER_SERVICE_ERROR",
    );
  }

  if (error instanceof AppError) {
    throw error;
  }

  const fallbackDetails = error instanceof Error ? error.message : error;
  throw new AppError(defaultMessage, 500, false, fallbackDetails as any);
};
