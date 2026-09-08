import { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../../errors/errors";

export const notFoundHandler = (
  req: Request,
  _res: Response,
  _next: NextFunction,
) => {
  if (req.originalUrl === "/favicon.ico") return;

  throw new NotFoundError("Route", req.originalUrl, {
    method: req.method,
    params: req.params,
    query: req.query,
  });
};
