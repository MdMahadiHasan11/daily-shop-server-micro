import axios from "axios";
import { NextFunction, Request, Response } from "express";
import { env } from "../../config/gateway.config";

const verifyAuthToken = async (
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

    const authResponse = await axios.post(
      `${env.AUTH_SERVICE}/v1/auth/verify-token`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Cookie: `accessToken=${token}`,
          "x-gateway-secret": env.GATEWAY_SECRET,
        },
        timeout: 5000,
        validateStatus: () => true, // Prevents axios from throwing on 4xx/5xx status codes
      },
    );

    // Handle Auth Service explicit rejections (Invalid/expired token)
    if (authResponse.status !== 200 || !authResponse.data.success) {
      return res.status(401).json({
        success: false,
        message:
          authResponse.data.message ||
          "Unauthorized - Invalid or expired token",
      });
    }

    const userData = authResponse.data.user || authResponse.data.data;

    // Inject user info into headers for downstream microservices
    req.headers["x-user-id"] = userData.id || "";
    req.headers["x-user-email"] = userData.email || "";
    req.headers["x-user-role"] = userData.role || "";
    req.headers["x-user-phone"] = userData.phone || "";

    next();
  } catch (error: any) {
    console.error("🔥 Gateway Auth Middleware Error:", error.message);

    // Check if it's an Axios network error (Auth service offline, refused, or timed out)
    if (axios.isAxiosError(error)) {
      if (
        error.code === "ECONNREFUSED" ||
        error.code === "ETIMEDOUT" ||
        !error.response
      ) {
        return res.status(502).json({
          success: false,
          message: "Bad Gateway - Auth service is unreachable or timed out.",
        });
      }
    }

    // Fallback general error
    return res.status(500).json({
      success: false,
      message: "Internal Gateway Error during token verification",
    });
  }
};

export const middlewares = {
  auth: verifyAuthToken,
};
