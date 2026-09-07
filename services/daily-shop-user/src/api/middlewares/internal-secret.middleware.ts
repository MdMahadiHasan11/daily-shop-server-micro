import { NextFunction, Request, Response } from "express";

export class authenticate {
  static auth(req: Request, res: Response, next: NextFunction) {
    const clientSecret = req.headers["x-internal-secret"];
    const expectedSecret = process.env.AUTH_TO_USER_SECRET;

    if (!clientSecret || clientSecret !== expectedSecret) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Invalid Auth Service Secret!",
      });
    }

    next();
  }

  static email(req: Request, res: Response, next: NextFunction) {
    const clientSecret = req.headers["x-internal-secret"];
    const expectedSecret = process.env.EMAIL_TO_USER_SECRET;

    if (!clientSecret || clientSecret !== expectedSecret) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Invalid Email Service Secret!",
      });
    }

    next();
  }
}
