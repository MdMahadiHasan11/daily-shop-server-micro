import axios from "axios";
import { NextFunction, Request, Response } from "express";
import { env } from "../../config/gateway.config";

export const verifyAuthAndInjectHeaders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided or invalid format",
      });
    }

    const response = await axios.post(
      `${env.AUTH_SERVICE}/api/v1/auth/verify`,
      {},
      { headers: { Authorization: authHeader } },
    );

    if (response.data && response.data.success) {
      const userInfo = response.data.data;
      req.headers["x-user-id"] = userInfo.id;
      req.headers["x-user-role"] = userInfo.role;
      next();
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access" });
    }
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: "Token verification failed",
      error: error.response?.data?.message || error.message,
    });
  }
};
