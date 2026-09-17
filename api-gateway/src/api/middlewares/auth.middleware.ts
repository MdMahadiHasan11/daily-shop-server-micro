import axios from "axios";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/gateway.config";
import { redisService } from "../../core/services/redis.service";

/**
 * Legacy/Remote Authentication Middleware
 * Validates the token by making an HTTP call to the Auth Service.
 */
const verifyRemoteAuth = async (
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
        validateStatus: () => true,
      },
    );

    if (authResponse.status !== 200 || !authResponse.data.success) {
      return res.status(401).json({
        success: false,
        message:
          authResponse.data.message ||
          "Unauthorized - Invalid or expired token",
      });
    }

    const userData = authResponse.data.user || authResponse.data.data;

    req.headers["x-user-id"] = userData.id || "";
    req.headers["x-user-email"] = userData.email || "";
    req.headers["x-user-role"] = userData.role || "";
    req.headers["x-user-phone"] = userData.phone || "";

    next();
  } catch (error: any) {
    console.error("🔥 Gateway Remote Auth Error:", error.message);

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

    return res.status(500).json({
      success: false,
      message: "Internal Gateway Error during token verification",
    });
  }
};

/**
 * High-Performance Local Asymmetric (RS256) + Redis Blacklist Authentication Middleware
 * Verifies the JWT signature locally using the Public Key and checks Redis for revocation (Logout).
 */
const verifyLocalAuth = async (
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

    const publicKey = env.JWT_PUBLIC_KEY?.replace(/\\n/g, "\n");

    if (!publicKey) {
      console.error("🔥 JWT_PUBLIC_KEY is missing in gateway environment");
      return res.status(500).json({
        success: false,
        message: "Internal Gateway Configuration Error",
      });
    }

    // 1. Verify token locally using RS256 algorithm and Public Key
    const decoded: any = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
    });

    const jti = decoded.jti;

    // 2. Check Redis for Token Blacklisting (Instant Logout Check) with a safety timeout (1.5s)
    if (jti) {
      try {
        const isBlacklisted = await Promise.race([
          redisService.get(jti, { namespace: "blacklist" }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Redis operation timeout")),
              1500,
            ),
          ),
        ]);

        if (isBlacklisted) {
          return res.status(401).json({
            success: false,
            message: "Unauthorized - Token has been revoked (Logged out)",
          });
        }
      } catch (redisError: any) {
        console.warn(
          `⚠️ [Gateway] Redis Blacklist check warning: ${redisError.message}`,
        );
        // Allows request to proceed if Redis is temporarily unreachable, prioritizing availability
      }
    }

    const userId = decoded.id || "";
    const userEmail = decoded.email || "";
    const userRole = decoded.role || "";
    const userPhone = decoded.phone || "";

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Invalid token payload",
      });
    }

    // Forward user context downstream via headers
    req.headers["x-user-id"] = userId;
    req.headers["x-user-email"] = userEmail;
    req.headers["x-user-role"] = userRole;
    req.headers["x-user-phone"] = userPhone;

    next();
  } catch (error: any) {
    console.error("🔥 Gateway Local Auth Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Token has expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Invalid token signature",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Unauthorized - Token verification failed",
    });
  }
};

export const middlewares = {
  auth: verifyRemoteAuth,
  localAuth: verifyLocalAuth,
};
