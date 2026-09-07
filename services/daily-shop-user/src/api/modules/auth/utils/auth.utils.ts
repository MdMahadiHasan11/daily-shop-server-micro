import bcrypt from "bcryptjs";
import crypto, { randomUUID } from "crypto";
import { Response } from "express";
import { env } from "../../../../core/config/env.config";
import { AppError, ErrorThrower } from "../../../../core/errors/errors";
import jwtHelper from "../../../../core/utils/jwt.helper";
interface TAuthCookiePayload {
  accessToken: string;
  refreshToken?: string;
}
class AuthUtils {
  /**
   * Create SHA-256 hash
   */
  static createHash(value: string): string {
    try {
      return crypto.createHash("sha256").update(value).digest("hex");
    } catch {
      throw new AppError(
        "Hash creation failed",
        500,
        true,
        undefined,
        "HASH_ERROR",
      );
    }
  }

  /**
   * Compare hash
   */
  static compareHash(value: string, hashedValue: string): boolean {
    try {
      return this.createHash(value) === hashedValue;
    } catch {
      throw new AppError(
        "Hash comparison failed",
        500,
        true,
        undefined,
        "HASH_COMPARE_ERROR",
      );
    }
  }

  /**
   * Bcrypt hash password
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, 10);
    } catch {
      throw new AppError(
        "Password hashing failed",
        500,
        true,
        undefined,
        "PASSWORD_HASH_ERROR",
      );
    }
  }

  /**
   * Compare password
   */
  static async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);

    if (!isMatch) {
      ErrorThrower.unauthorized("Invalid credentials");
    }
    return isMatch;
  }

  /**
   * Refresh tokens
   */
  // static async refreshTokens(refreshToken: string) {
  //   try {
  //     const decoded = jwtHelper.verifyToken(refreshToken);
  //     delete decoded.iat;
  //     delete decoded.exp;

  //     return {
  //       newAccessToken: jwtHelper.generateToken(decoded),
  //       newRefreshToken: jwtHelper.generateRefreshToken(decoded),
  //     };
  //   } catch {
  //     throw new AppError(
  //       "Invalid refresh token",
  //       401,
  //       true,
  //       undefined,
  //       "INVALID_REFRESH_TOKEN",
  //     );
  //   }
  // }

  /**
   * Password strength
   */
  static validatePasswordStrength(password: string) {
    const minLength = 8;

    if (password.length < minLength) {
      return { valid: false, message: "Password too short" };
    }

    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "Need uppercase" };
    }

    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "Need lowercase" };
    }

    if (!/\d/.test(password)) {
      return { valid: false, message: "Need number" };
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: "Need special char" };
    }

    return { valid: true };
  }

  static generateNumericOtp(length = 6): string {
    const digits = "0123456789";
    let otp = "";

    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }

    return otp;
  }

  static generateSecureOtp(length = 6, alphanumeric = false): string {
    const chars = alphanumeric
      ? "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
      : "0123456789";

    const bytes = crypto.randomBytes(length);
    let otp = "";

    for (let i = 0; i < length; i++) {
      otp += chars[bytes[i] % chars.length];
    }

    return otp;
  }

  static generateDeviceToken() {
    return crypto.randomBytes(48).toString("hex");
  }

  static hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  static setAuthCookies(res: Response, payload: TAuthCookiePayload) {
    const { accessToken, refreshToken } = payload;

    const accessTokenMaxAge =
      env.COOKIE_ACCESS_TOKEN_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    const refreshTokenMaxAge =
      env.COOKIE_REFRESH_TOKEN_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    res.cookie("accessToken", accessToken, {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "none",
      maxAge: accessTokenMaxAge,
    });

    if (refreshToken) {
      res.cookie("refreshToken", refreshToken, {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "none",
        maxAge: refreshTokenMaxAge,
      });
    }
  }

  static generateTemporaryPassword(length = 12 as number): string {
    return crypto
      .randomBytes(length)
      .toString("base64") // convert to base64 string
      .replace(/[^a-zA-Z0-9]/g, "") // remove non-alphanumeric chars
      .slice(0, length); // trim to desired length
  }

  static generateTemporarySessionId(): string {
    return randomUUID();
  }
}

export default AuthUtils;
