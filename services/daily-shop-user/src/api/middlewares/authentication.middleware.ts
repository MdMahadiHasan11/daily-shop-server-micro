import { NextFunction, Request, Response } from "express";
import { AuthController } from "../modules/auth/auth.controller";
// import { AuthController } from "../modules/auth/auth.controller";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cookieToken = req.cookies?.accessToken;
    const authHeader = req.headers.authorization;

    const token =
      cookieToken ||
      (authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : undefined);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
    }
    const result = await new AuthController().validateToken(req);
    req.user = result;
    next();
  } catch (error: any) {
    console.error("Authentication Error:", error.message);
    return res.status(401).json({
      success: false,
      message: error.message || "Invalid or expired token",
    });
  }
};
