import { Prisma } from "@prisma/client";
import axios from "axios";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../../core/errors/errors";

/**
 * GLOBAL ERROR HANDLER (MUST BE LAST MIDDLEWARE)
 */
export const globalErrorHandler = async (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let error: any = err;

  // ===============================
  // LOG ALL ERRORS
  // ===============================
  console.error("🔥 GLOBAL ERROR:", {
    path: req.originalUrl,
    method: req.method,
    error,
  });

  // ===============================
  // PRISMA KNOWN REQUEST ERRORS
  // ===============================
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const targetMeta = error.meta?.target as string[];
      const driverConstraint = (error.meta?.driverAdapterError as any)?.cause
        ?.constraint?.index;

      let fieldName = "field";
      if (targetMeta && targetMeta.length > 0) {
        fieldName = targetMeta.join(", ");
      } else if (driverConstraint) {
        const parts = driverConstraint.split("_");
        if (parts.length > 2 && parts[parts.length - 1] === "key") {
          const fields = parts.slice(1, -1);
          fieldName = fields.join(", ");
        } else if (parts.length >= 2) {
          fieldName = parts[1];
        } else {
          fieldName = driverConstraint;
        }
      }

      error = new AppError(
        `Duplicate value violates unique constraint. A record with this ${fieldName} already exists.`,
        409,
        true,
        error.meta,
        "DUPLICATE_ENTITY",
      );
    } else if (error.code === "P2025") {
      error = new AppError(
        "Requested record not found in the database.",
        404,
        true,
        error.meta,
        "RECORD_NOT_FOUND",
      );
    } else if (error.code === "P2003") {
      const driverConstraint = (error.meta?.driverAdapterError as any)?.cause
        ?.constraint?.index;

      let fieldName = "related record";
      if (driverConstraint) {
        const parts = driverConstraint.split("_");
        if (parts.length >= 2) {
          fieldName = parts[1];
        }
      }

      error = new AppError(
        `Foreign key constraint failed. The provided '${fieldName}' does not exist in the referenced table.`,
        400,
        true,
        error.meta,
        "FOREIGN_KEY_VIOLATION",
      );
    } else if (error.code === "P2021") {
      const tableName =
        error.meta?.table ||
        (error.meta?.driverAdapterError as any)?.cause?.table ||
        "database table";

      error = new AppError(
        `The table '${tableName}' does not exist in the database. Please check your migrations.`,
        500,
        true,
        error.meta,
        "TABLE_NOT_FOUND",
      );
    }
  }

  // ===============================
  // PRISMA VALIDATION & INIT ERRORS (NEWLY ADDED)
  // ===============================
  if (error instanceof Prisma.PrismaClientValidationError) {
    error = new AppError(
      "Database validation failed. Please check your request payload fields and data types.",
      400,
      true,
      error.message,
      "PRISMA_VALIDATION_ERROR",
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    error = new AppError(
      "Database connection failed. Please check your database server.",
      500,
      true,
      error.message,
      "DB_CONNECTION_ERROR",
    );
  }

  // ===============================
  // BODY PARSER / JSON SYNTAX ERROR
  // ===============================
  const errObj = error as any;
  if (
    error instanceof SyntaxError ||
    errObj?.type === "entity.parse.failed" ||
    (errObj?.status === 400 && "body" in errObj)
  ) {
    error = new AppError(
      "Invalid or empty JSON payload passed in the request body. Please ensure your request contains properly formatted JSON.",
      400,
      true,
      errObj.body || errObj.message,
      "INVALID_JSON_BODY",
    );
  }

  // ===============================
  // CUSTOM APP ERROR
  // ===============================
  if (error instanceof AppError) {
    return sendErrorResponse(error, req, res);
  }

  // ===============================
  // UNKNOWN ERROR (SAFE FALLBACK)
  // ===============================
  const fallbackError = new AppError(
    "Internal Server Error",
    500,
    false,
    error,
    "INTERNAL_ERROR",
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

  const fallbackDetails = error instanceof Error ? error.stack : error;
  throw new AppError(defaultMessage, 500, false, fallbackDetails as any);
};
