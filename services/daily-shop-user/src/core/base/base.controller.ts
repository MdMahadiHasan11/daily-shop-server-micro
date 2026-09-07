import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { AppError } from "../errors/errors";
import { getRequestMetadata } from "../utils/request-metadata";
import { responseUtil } from "../utils/response.util";

export abstract class BaseController {
  protected successResponse = responseUtil.success;
  protected errorResponse = responseUtil.error;
  protected getReqMetadata = getRequestMetadata;

  protected queryParse<T extends { query: any }>(
    req: Request,
    schema: ZodSchema<T>,
  ): T["query"] {
    const parsed = schema.safeParse({ query: req.query }) as any;

    if (!parsed.success) {
      throw new ZodError(parsed.error.errors);
    }

    return parsed.data.query;
  }

  protected asyncHandler =
    (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
      Promise.resolve(fn(req, res, next)).catch(next);

  protected handleError(res: Response, error: unknown): Response {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    console.error("[Unhandled Error]", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
