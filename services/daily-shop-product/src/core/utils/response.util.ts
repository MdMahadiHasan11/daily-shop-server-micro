import { Response } from "express";
import { HttpStatusCodes } from "../../common/constants/httpResponse";

type Metadata = Partial<
  Record<"query" | "pagination" | "message" | "action" | "summary", any>
>;

class ResponseUtil {
  /**
   * Success Response
   */
  public success<T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    metadata?: Metadata,
  ): Response {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      type: HttpStatusCodes[statusCode]?.type || "SUCCESS",

      message:
        metadata?.message ||
        HttpStatusCodes[statusCode]?.message ||
        "Request successful",

      data,

      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Error Response
   */
  public error(
    res: Response,
    error: Error | string,
    statusCode: number = 500,
    context?: Record<string, any>,
  ): Response {
    const isErrorObject = error instanceof Error;

    const message = isErrorObject ? error.message : error;

    return res.status(statusCode).json({
      success: false,
      statusCode,

      type: HttpStatusCodes[statusCode]?.type || "INTERNAL_SERVER_ERROR",

      message:
        message ||
        HttpStatusCodes[statusCode]?.message ||
        "Something went wrong",

      error: {
        name: isErrorObject ? error.name : "ResponseError",
        ...context,
        timestamp: new Date().toISOString(),
      },

      ...(process.env.NODE_ENV === "development" && {
        stack: isErrorObject ? error.stack : undefined,
      }),
    });
  }
}

export const responseUtil = new ResponseUtil();
