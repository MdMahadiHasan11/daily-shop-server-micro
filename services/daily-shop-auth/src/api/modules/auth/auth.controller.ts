import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import sessionService from "../../../core/services/session.service";
import jwtHelper from "../../../core/utils/jwt.helper";
import { IMetaData } from "../../../core/utils/request-metadata";
import { AuthService } from "./auth.service";
import { ISession, IUserJwtPayload } from "./auth.type";
import { LoginDto } from "./auth.validator";
import AuthUtils from "./utils/auth.utils";

export class AuthController extends BaseController {
  private service: AuthService;

  constructor() {
    super();
    this.service = new AuthService();
  }

  loginInitiate = this.asyncHandler(async (req: Request, res: Response) => {
    const { phone, email } = req.validatedBody.body as LoginDto["body"];
    const identifier = phone ? phone : email;

    await this.service.initiateLoginOtp(phone, email);

    return this.successResponse(res, {
      message: `OTP sent successfully to ${identifier}`,
      identifier: identifier,
    });
  });

  loginVerify = this.asyncHandler(async (req: Request, res: Response) => {
    const { email, phone, otp } = req.validatedBody.body;
    const userAgent = req.headers["user-agent"] || "unknown";
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.ip || "unknown";
    const result = await this.service.verifyLoginOtp(
      phone,
      email,
      otp,
      userAgent,
      ipAddress,
    );

    if (!result.success) {
      return this.errorResponse(res, result.message, 400);
    }

    AuthUtils.setAuthCookies(res, {
      accessToken: result?.data?.accessToken,
      refreshToken: result?.data?.refreshToken,
    });

    const user = result.data.user;

    return this.successResponse(
      res,
      { user, isNewUser: result.data.isNewUser },
      200,
    );
  });

  async validateToken(req: Request) {
    try {
      const cookieToken = req.cookies?.accessToken;
      const authHeader = req.headers.authorization;

      const accessToken =
        cookieToken ||
        (authHeader?.startsWith("Bearer ")
          ? authHeader.split(" ")[1]
          : undefined);

      if (!accessToken) {
        throw new Error("No token provided");
      }

      const decoded = (await jwtHelper.verifyAccessToken(
        accessToken,
      )) as IUserJwtPayload;

      const session = (await sessionService.validateSession(
        decoded.jti,
      )) as ISession | null;

      if (!session?.valid) {
        throw new Error("Invalid session");
      }

      const user = {
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email || null,
        phoneNumber: decoded.phoneNumber,
        jti: decoded.jti,
      };
      return user;
    } catch (error) {
      throw error;
    }
  }

  getMe = this.asyncHandler(async (req: Request, res: Response) => {
    const metaData: IMetaData = this.getReqMetadata(req);
    const user = await this.service.getMe(metaData as IMetaData);
    return this.successResponse(res, user, 200);
  });

  logout = this.asyncHandler(async (req: Request, res: Response) => {
    try {
      const accessToken =
        req.cookies?.accessToken ||
        (req.headers.authorization?.startsWith("Bearer ")
          ? req.headers.authorization.split(" ")[1]
          : undefined);

      // if (accessToken) {
      //   try {
      //     const decoded = await jwtHelper.verifyAccessToken<{ jti: string }>(
      //       accessToken,
      //     );

      //     if (decoded?.jti) {
      //       const session = (await sessionService.validateSession(
      //         decoded.jti,
      //       )) as ISession;
      //       if (session?.valid) {
      //         await sessionService.revokeSession(decoded.jti);
      //       }
      //     }
      //   } catch (err) {
      //     console.log("Logout token verification skipped or failed:", err);
      //   }
      // }
      await this.service.logout(accessToken);

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" as const,
        path: "/",
      };

      res.clearCookie("refreshToken", cookieOptions);
      res.clearCookie("accessToken", cookieOptions);

      return this.successResponse(
        res,
        { message: "Logged out successfully" },
        200,
      );
    } catch (error) {
      res.clearCookie("refreshToken");
      res.clearCookie("accessToken");

      return this.successResponse(
        res,
        { message: "Logged out successfully" },
        200,
      );
    }
  });
}
