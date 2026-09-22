import type { ZodIssue } from "zod";

declare global {
  namespace AppError {
    interface BaseError {
      name: string;
      message: string;
      statusCode: number;
      isOperational: boolean;
      details?: unknown;
      code?: string;
    }

    interface ValidationError extends BaseError {
      issues: ZodIssue[];
    }

    interface DatabaseError extends BaseError {
      meta?: Record<string, unknown>;
      prismaCode?: string;
    }

    interface RateLimitError extends BaseError {
      resetTime: Date;
    }
  }
}

export type AppError =
  | AppError.BaseError
  | AppError.ValidationError
  | AppError.DatabaseError
  | AppError.RateLimitError;

export interface ErrorResponse {
  status: "error";
  message: string;
  code: string;
  timestamp?: string;
  path?: string;
  method?: string;
  details?: ErrorDetail[];
  metadata?: Record<string, any>;
  debug?: {
    stack?: string;
    originalError?: {
      name?: string;
      message?: string;
    };
  };
}

export interface ErrorDetail {
  field: string;
  message: string;
  code: string;
  [key: string]: any;
}
