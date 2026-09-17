import { AuthProvider, User } from "@prisma/client";
import axios from "axios";
import { EVENTS } from "../../../bootstrap/event.constants";
import { BaseService } from "../../../core/base/base.service";
import { env } from "../../../core/config/env.config";
import { AppError } from "../../../core/errors/errors";
import { CACHE_KEYS } from "../../../core/redis/redis.constant";
import sessionService from "../../../core/services/session.service";
import jwtHelper from "../../../core/utils/jwt.helper";
import { IMetaData } from "../../../core/utils/request-metadata";
import { AuthRepository } from "./auth.repository";
import { ISession } from "./auth.type";
import AuthUtils from "./utils/auth.utils";
export class AuthService extends BaseService {
  private repository: AuthRepository;

  constructor() {
    super();
    this.repository = new AuthRepository();
    this.serviceName = "AuthService";
  }
  async userExist(identifier: string): Promise<User | null> {
    return await this.repository.getUserByIdentity(identifier);
  }

  async initiateLoginOtp(phone?: string, email?: string): Promise<void> {
    try {
      const identifier = phone ? phone : email;

      if (!identifier) {
        throw new AppError("Either phone or email must be provided", 400);
      }

      const otp = AuthUtils.generateNumericOtp();
      const TTL_SECONDS = env.OTP_TTL_SECONDS;

      await this.cache.set(`otp:${identifier}:${otp}`, otp, {
        ttl: TTL_SECONDS,
      });

      // here email service call after todo
      await this.eventBus.publish(EVENTS.LOGIN_INITIATE, {
        payload: {
          name: "Valued User",
          phone,
          email,
          otp,
          expirySeconds: TTL_SECONDS,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this._handleError(error, "initiateLoginOtp", { phone, email });
      throw error;
    }
  }

  async verifyLoginOtp(
    phone?: string,
    email?: string,
    otp?: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      accessToken: string;
      refreshToken: string;
      user: User;
      isNewUser: Boolean;
    };
  }> {
    try {
      const identifier = phone ? phone : email;

      if (!identifier || !otp) {
        throw new AppError("Identifier and OTP are required", 400);
      }

      const cacheKey = `otp:${identifier}:${otp}`;
      const storedOtp = await this.cache.get(cacheKey);

      if (!storedOtp || String(storedOtp) !== String(otp)) {
        throw new AppError("Invalid or expired OTP", 400);
      }

      await this.cache.delete(cacheKey);

      let user = await this.repository.getUserByIdentity(identifier);
      const isNewUser = user ? false : true;

      if (!user) {
        user = await this.repository.createUserWithProfileAndAccount({
          phoneNumber: phone || null,
          email: email || null,
          phoneNumberVerified: !!phone,
          emailVerified: !!email,
          provider: phone ? AuthProvider.PHONE : AuthProvider.LOCAL,
          providerAccountId: identifier,
        });
        await this.eventBus.publish(EVENTS.AFTER_LOGIN_USER_CREATE, {
          payload: {
            authId: user.id,
            phoneNumber: phone || null,
            email: email || null,
          },
        });
      }

      const { accessToken, refreshToken, jti, expired } =
        await sessionService.createSession(
          user?.id,
          user?.role,
          user?.email,
          user?.phoneNumber,
          userAgent,
          ipAddress,
        );

      const expiresAtDate = new Date(Date.now() + expired * 1000);
      await this.repository.createUserSession({
        userId: user.id,
        sessionToken: jti,
        userAgent: userAgent,
        ipAddress: ipAddress,
        expiresAt: expiresAtDate,
      });

      return {
        success: true,
        message: "Verification and login successful",
        data: { accessToken, refreshToken, user, isNewUser },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this._handleError(error, "verifyLoginOtp", { phone, email });
      throw error;
    }
  }

  async getMe(metaData: IMetaData): Promise<any> {
    try {
      if (!metaData?.id) {
        throw new AppError("Unauthorized user request", 401);
      }

      const cacheKey = CACHE_KEYS.userProfile(metaData?.id);

      const cachedUser = await this.cache.get(cacheKey);

      if (cachedUser) {
        return typeof cachedUser === "string"
          ? JSON.parse(cachedUser)
          : cachedUser;
      }

      const authUser = await this.repository.getUserByIdentity(metaData?.id);
      if (!authUser) {
        throw new AppError("User profile not found", 404);
      }

      const userProfileResponse = await this.service.get(
        "user",
        "/me",
        metaData,
      );

      const fullUserProfile =
        userProfileResponse.data?.data || userProfileResponse.data;

      await this.cache.set(cacheKey, JSON.stringify(fullUserProfile), {
        ttl: 900,
      });

      return fullUserProfile;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        this.handleAxiosError(
          error,
          "Failed to fetch user profile from user service",
        );
      }

      this._handleError(error, "getMe", { userId: metaData?.id });
      const errorDetails = error instanceof Error ? error.stack : error;
      throw new AppError(
        "Internal Server Error",
        500,
        false,
        errorDetails as any,
      );
    }
  }

  async logout(accessToken?: string): Promise<void> {
    try {
      if (!accessToken) {
        return;
      }

      const decoded = await jwtHelper.verifyAccessToken<{
        jti: string;
        exp?: number;
      }>(accessToken);

      if (decoded?.jti) {
        if (decoded.exp) {
          const expiresInSeconds = decoded.exp - Math.floor(Date.now() / 1000);
          if (expiresInSeconds > 0) {
            this.cache.set(decoded.jti, "revoked", {
              ttl: expiresInSeconds,
              namespace: "blacklist",
            });
          }
        }

        const session = (await sessionService.validateSession(
          decoded.jti,
        )) as ISession;

        if (session && session.id) {
          const cacheKey = CACHE_KEYS.userProfile(session.id);
          await this.cache.delete(cacheKey);
        }

        await this.repository.updateUserSessionStatusByToken(decoded.jti);

        if (session?.valid) {
          await sessionService.revokeSession(decoded.jti);
        }
      }
    } catch (error) {
      this._handleError(error, "logout_warning");
    }
  }
}
