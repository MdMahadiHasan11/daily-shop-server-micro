import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

/**
 * Global Error Handler for File Service
 * (Cloudinary / Multer / Upload system)
 */
const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let success = false;
  let message = err.message || "File service error occurred";
  let error = err.error || err;

  // ===============================
  // Multer Errors (File Upload)
  // ===============================
  if (err.name === "MulterError") {
    statusCode = httpStatus.BAD_REQUEST;

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File too large";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected file field";
    } else {
      message = "File upload error";
    }

    error = err.message;
  }

  // ===============================
  // Cloudinary Errors
  // ===============================
  if (err.http_code && err.name === "Error") {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Cloud storage error";
    error = err.message;
  }

  // ===============================
  // General Log (for debugging)
  // ===============================
  console.error("[FILE-SERVICE ERROR]", {
    statusCode,
    message,
    path: req.originalUrl,
    method: req.method,
    error,
  });

  // ===============================
  // Response
  // ===============================
  return res.status(statusCode).json({
    success,
    message,
    error,
  });
};

export default globalErrorHandler;
