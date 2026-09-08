import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { humanizeZodErrors } from "../../core/utils/common.utils";

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
      cookies: req.cookies,
    }) as any;
    if (!result.success) {
      const formattedErrors =
        result.error?.issues.map((err: any) => {
          return {
            code: err?.code,
            field: err.path.join("."),
            message: err.message,
            values: err.values,
            details: humanizeZodErrors(err.errors),
          };
        }) ?? [];
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: formattedErrors,
      });

      return;
    }

    req.validatedBody = result.data;
    next();
  };
}
