import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
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
  // ZOD VALIDATION ERROR
  // ===============================
  // if (error instanceof ZodError) {
  //   error = new ValidationError(error);
  // }

  // ===============================
  // PRISMA ERROR HANDLING
  // ===============================
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      // Extract target from standard prisma meta or driver adapter constraint index
      const targetMeta = error.meta?.target as string[];
      const driverConstraint = (error.meta?.driverAdapterError as any)?.cause?.constraint?.index;
      
      let fieldName = "field";
      if (targetMeta && targetMeta.length > 0) {
        fieldName = targetMeta.join(", ");
      } else if (driverConstraint) {
        // e.g., "suppliers_name_key" -> parts: ["suppliers", "name", "key"]
        const parts = driverConstraint.split("_");
        
        if (parts.length > 2 && parts[parts.length - 1] === "key") {
          // Drop table name (first) and "key" (last), leaving the field name(s)
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
        "DUPLICATE_ENTITY"
      );
    } else if (error.code === "P2025") {
      // Record not found
      error = new AppError(
        "Requested record not found in the database.",
        404,
        true,
        error.meta,
        "RECORD_NOT_FOUND"
      );
    }
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

  // await notifySlack(fallbackError, req);
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