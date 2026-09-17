import cuid from "cuid";
import jwt from "jsonwebtoken";
import { env } from "../config/env.config";
import { AppError } from "../errors/errors";

export class JwtHelper {
  private accessSecret = env.JWT_ACCESS_SECRET || env.JWT_SECRET;
  private accessPrivatekey = env.JWT_PRIVATE_KEY;
  private accessPublickey = env.JWT_PUBLIC_KEY;
  private refreshSecret = env.JWT_REFRESH_SECRET || env.JWT_SECRET;

  verifyAccessToken = <T extends object = any>(token: string): T => {
    try {
      return jwt.verify(token, this.accessPublickey, {
        algorithms: ["RS256"],
      }) as T;
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        throw new AppError(
          "Token has expired",
          401,
          true,
          undefined,
          "TOKEN_EXPIRED",
        );
      }

      if (err.name === "JsonWebTokenError") {
        throw new AppError(
          "Invalid token",
          401,
          true,
          undefined,
          "INVALID_TOKEN",
        );
      }

      throw new AppError(
        "Token verification failed",
        401,
        true,
        undefined,
        "TOKEN_VERIFY_FAILED",
      );
    }
  };

  verifyRefreshToken = <T extends object = any>(token: string): T => {
    try {
      return jwt.verify(token, this.refreshSecret) as T;
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        throw new AppError(
          "Token has expired",
          401,
          true,
          undefined,
          "TOKEN_EXPIRED",
        );
      }

      if (err.name === "JsonWebTokenError") {
        throw new AppError(
          "Invalid token",
          401,
          true,
          undefined,
          "INVALID_TOKEN",
        );
      }

      throw new AppError(
        "Token verification failed",
        401,
        true,
        undefined,
        "TOKEN_VERIFY_FAILED",
      );
    }
  };

  // generateRefreshToken = (
  //   userId: string,
  //   options?: jwt.SignOptions,
  // ): string => {
  //   if (!this.refreshSecret) {
  //     throw new AppError(
  //       "JWT refresh secret is not defined in config",
  //       500,
  //       true,
  //       undefined,
  //       "JWT_CONFIG_ERROR",
  //     );
  //   }

  //   return jwt.sign({ userId }, this.refreshSecret, {
  //     expiresIn: env.JWT_REFRESH_EXPIRATION,
  //     ...options,
  //   } as jwt.SignOptions);
  // };

  // verifyRefreshToken<T extends object = any>(token: string): T {
  //   try {
  //     return jwt.verify(token, this.refreshSecret) as T;
  //   } catch (err: any) {
  //     if (err.name === "TokenExpiredError") {
  //       throw new AppError(
  //         "Refresh token has expired",
  //         401,
  //         true,
  //         undefined,
  //         "REFRESH_EXPIRED",
  //       );
  //     }

  //     if (err.name === "JsonWebTokenError") {
  //       throw new AppError(
  //         "Invalid refresh token",
  //         401,
  //         true,
  //         undefined,
  //         "INVALID_REFRESH_TOKEN",
  //       );
  //     }

  //     throw new AppError(
  //       "Refresh token verification failed",
  //       401,
  //       true,
  //       undefined,
  //       "REFRESH_VERIFY_FAILED",
  //     );
  //   }
  // }

  // decodeToken<T extends object = any>(token: string): T | null {
  //   return jwt.decode(token) as T | null;
  // }

  // extractHeaderToken = (authHeader?: string): string | null => {
  //   if (!authHeader?.startsWith("Bearer ")) return null;
  //   return authHeader.slice(7).trim();
  // };

  generateAccessAndRefresh(payload: object) {
    const jti = cuid();
    // const accessToken = jwt.sign({ ...payload, jti }, this.accessSecret, {
    //   expiresIn: env.JWT_ACCESS_EXPIRATION as any,
    // });
    const accessToken = jwt.sign({ ...payload, jti }, this.accessPrivatekey, {
      algorithm: "RS256",
      expiresIn: env.JWT_ACCESS_EXPIRATION as any,
    });

    const refreshToken = jwt.sign(
      { jti, type: "refresh" },
      this.refreshSecret,
      {
        expiresIn: env.JWT_REFRESH_EXPIRATION as any,
      },
    );
    return { accessToken, refreshToken, jti };
  }
}

export default new JwtHelper();
