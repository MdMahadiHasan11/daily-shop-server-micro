import { logger } from "../utils/logger.utils";

export type ErrorDetails =
  | Record<string, unknown>
  | unknown[]
  | string
  | undefined;

// ==========================================
// Base Application Error
// ==========================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details: ErrorDetails;
  public readonly code: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 400,
    isOperational = true,
    details: ErrorDetails = undefined,
    code = "APPLICATION_ERROR",
    context?: Record<string, unknown>,
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.code = code;
    this.timestamp = new Date();
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toJSON(): Record<string, unknown> {
    return {
      success: false,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      ...(this.details && { details: this.details }),
      ...(process.env.NODE_ENV !== "production" && {
        stack: this.stack,
        context: this.context,
      }),
    };
  }

  public toString(): string {
    return `[${this.timestamp.toISOString()}] ${this.name} (${this.code}): ${this.message}`;
  }

  public static logError(error: AppError): void {
    logger.error(
      {
        details: error.details,
        context: error.context,
      },
      `[AppError] ❌ ${error.toString()}`,
    );
  }
}

// ==========================================
// Specialized Resource Error
// ==========================================

export class NotFoundError extends AppError {
  constructor(
    resource: string,
    identifier: string | number,
    details?: ErrorDetails,
  ) {
    super(
      `${resource} with ID/Path '${identifier}' not found`,
      404,
      true,
      details,
      resource === "Route" ? "ROUTE_NOT_FOUND" : "RESOURCE_NOT_FOUND",
      { resource, identifier },
    );
  }
}

// ==========================================
// Functional Helper Throwers
// ==========================================

export const throwUnauthorized = (message = "Unauthorized access"): never => {
  throw new AppError(message, 401, true, undefined, "UNAUTHORIZED");
};

export const throwNotFound = (
  resource: string,
  id?: string | number,
): never => {
  throw new NotFoundError(resource, id || "unknown");
};

export const ErrorThrower = {
  unauthorized: throwUnauthorized,
  notFound: throwNotFound,
};
