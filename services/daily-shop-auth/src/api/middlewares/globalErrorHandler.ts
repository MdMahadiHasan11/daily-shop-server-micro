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
  // ZOD VALIDATION ERROR
  // ===============================
  // if (error instanceof ZodError) {
  //   error = new ValidationError(error);
  // }

  // ===============================
  // PRISMA ERROR
  // ===============================
  // if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //   error = new DatabaseError(error);
  // }

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
