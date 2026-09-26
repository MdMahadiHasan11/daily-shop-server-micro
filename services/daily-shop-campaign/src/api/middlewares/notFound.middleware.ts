import { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../../core/errors/errors";

export const notFoundHandler = (
  req: Request,
  _res: Response,
  _next: NextFunction,
) => {
  if (req.originalUrl === "/favicon.ico") return;
  // You can customize this based on your needs
  throw new NotFoundError("Route", req.originalUrl, {
    method: req.method,
    params: req.params,
    query: req.query,
  });
};
