import { Prisma } from "@prisma/client";
import { ZodError, ZodIssue } from "zod";
import { ErrorDetail } from "../../types/errors";
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
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      isOperational: this.isOperational,
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

  public static fromError(
    error: Error,
    overrides: Partial<
      Pick<
        AppError,
        "statusCode" | "isOperational" | "details" | "code" | "context"
      >
    > = {},
  ): AppError {
    return new AppError(
      error.message,
      overrides.statusCode ?? 500,
      overrides.isOperational ?? false,
      overrides.details ?? error.stack ?? undefined,
      overrides.code ?? "INTERNAL_ERROR",
      overrides.context,
    );
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
// Validation Error Class (Zod Integration)
// ==========================================

export class ValidationError extends AppError {
  public readonly issues: ZodIssue[];
  public readonly flattenedErrors: {
    fieldErrors: Record<string, string[]>;
    formErrors: string[];
  };

  constructor(issues: ZodError | ZodIssue[]) {
    const parsedIssues = issues instanceof ZodError ? issues.issues : issues;
    const flattened = issues instanceof ZodError ? issues.flatten() : null;

    super(
      "Validation failed",
      400,
      true,
      ValidationError.transformIssuesToDetails(parsedIssues),
      "VALIDATION_ERROR",
    );

    this.issues = parsedIssues;
    this.flattenedErrors = flattened || {
      fieldErrors: ValidationError.getFieldErrors(parsedIssues),
      formErrors: ValidationError.getFormErrors(parsedIssues),
    };

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  private static transformIssuesToDetails(issues: ZodIssue[]): ErrorDetail[] {
    return issues.map((issue) => ({
      field: issue.path.join(".") || "general",
      message: issue.message,
      code: issue.code,
      ...(issue.path.length > 0 && { path: issue.path }),
    }));
  }

  private static getFieldErrors(issues: ZodIssue[]): Record<string, string[]> {
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of issues) {
      const field = issue.path.join(".");
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }

    return fieldErrors;
  }

  private static getFormErrors(issues: ZodIssue[]): string[] {
    return issues
      .filter((issue) => issue.path.length === 0)
      .map((issue) => issue.message);
  }
}

// ==========================================
// Database Error Class (Prisma Integration)
// ==========================================

export class DatabaseError extends AppError {
  public readonly prismaCode: string;
  public readonly meta?: Record<string, unknown>;
  public readonly target?: string[];

  constructor(error: Prisma.PrismaClientKnownRequestError) {
    const message = DatabaseError.getErrorMessage(error);
    const details = DatabaseError.getErrorDetails(error);

    super(
      message,
      DatabaseError.getStatusCode(error),
      true,
      details,
      DatabaseError.getApplicationCode(error),
    );

    this.prismaCode = error.code;
    this.meta = error.meta;
    this.target = Array.isArray(error.meta?.target)
      ? (error.meta.target as string[])
      : undefined;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }

  private static getApplicationCode(
    error: Prisma.PrismaClientKnownRequestError,
  ): string {
    switch (error.code) {
      case "P2002":
        return "UNIQUE_CONSTRAINT";
      case "P2025":
        return "NOT_FOUND";
      case "P2003":
        return "FOREIGN_KEY_CONSTRAINT";
      default:
        return "DATABASE_ERROR";
    }
  }

  private static getTargetField(
    error: Prisma.PrismaClientKnownRequestError,
  ): string | null {
    const target = error.meta?.target;

    // CASE 1: Standard Prisma engine unique field array
    if (Array.isArray(target) && target.length > 0) {
      return target.join(", ");
    }

    // CASE 2: Driver Adapter Fallback parsing
    const driverMeta = error.meta as
      | {
          driverAdapterError?: {
            cause?: { originalMessage?: string };
            message?: string;
          };
        }
      | undefined;

    const originalMessage =
      driverMeta?.driverAdapterError?.cause?.originalMessage ??
      driverMeta?.driverAdapterError?.message ??
      "";

    const completeString = `${originalMessage} ${error.message}`;

    // Matches standard Postgres index naming conventions e.g., "_email_key"
    const keyMatch = completeString.match(/_([a-zA-Z0-9]+)_key/);
    if (keyMatch?.[1]) return keyMatch[1];

    // Explicit quoted field match e.g., fields: (`email`)
    const explicitMatch = completeString.match(/fields:\s*\(?`([^`]+)`\)?/);
    if (explicitMatch?.[1]) return explicitMatch[1];

    return null;
  }

  private static getErrorMessage(
    error: Prisma.PrismaClientKnownRequestError,
  ): string {
    switch (error.code) {
      case "P2002": {
        const field = this.getTargetField(error);
        return field
          ? `Duplicate entry for (${field})`
          : "Duplicate value already exists";
      }
      case "P2025":
        return "Record not found";
      case "P2003":
        return "Related record does not exist";
      default:
        return "Database operation failed";
    }
  }

  private static getStatusCode(
    error: Prisma.PrismaClientKnownRequestError,
  ): number {
    if (["P2002", "P2003", "P2011"].includes(error.code)) return 409;
    if (["P2001", "P2015", "P2025"].includes(error.code)) return 404;
    if (["P2000", "P2005", "P2020"].includes(error.code)) return 400;
    if (error.code === "P2024") return 503;
    return 500;
  }

  private static getErrorDetails(
    error: Prisma.PrismaClientKnownRequestError,
  ): ErrorDetail[] {
    switch (error.code) {
      case "P2002": {
        const field = this.getTargetField(error) ?? "unknown";
        return [
          {
            field,
            message: `${field} already exists`,
            code: "UNIQUE_CONSTRAINT",
          },
        ];
      }
      case "P2025":
        return [
          {
            field: "resource",
            message: "Record not found",
            code: "NOT_FOUND",
          },
        ];
      case "P2003":
        return [
          {
            field: "relation",
            message: "Related record does not exist",
            code: "FOREIGN_KEY_CONSTRAINT",
          },
        ];
      default:
        return [
          {
            field: "database",
            message: "Database operation failed",
            code: error.code,
          },
        ];
    }
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
      `${resource} with ID ${identifier} not found`,
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

export const throwValidation = (message: string): never => {
  throw new AppError(message, 400, true, undefined, "VALIDATION_ERROR");
};

export const throwUnauthorized = (message = "Unauthorized"): never => {
  throw new AppError(message, 401, true, undefined, "UNAUTHORIZED");
};

export const throwNotFound = (
  resource: string,
  id?: string | number,
): never => {
  throw new AppError(
    `${resource} not found`,
    404,
    true,
    undefined,
    "NOT_FOUND",
    { resource, id },
  );
};

export const throwUnhandled = (error: unknown): never => {
  const message = error instanceof Error ? error.message : String(error);
  throw new AppError(message, 500, false, undefined, "UNHANDLED_ERROR");
};

export const ErrorThrower = {
  validation: throwValidation,
  unauthorized: throwUnauthorized,
  notFound: throwNotFound,
  unhandled: throwUnhandled,
};
