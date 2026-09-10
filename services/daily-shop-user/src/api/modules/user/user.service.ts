import { UserProfileMaster } from "@prisma/client";
import { PaginationResult } from "../../../common/interfaces";
import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { IMetaData } from "../../../core/utils/request-metadata";
import { UserRepository } from "./user.repository";
import { UserListQuery } from "./user.validator";

export class UserService extends BaseService {
  private readonly repository: UserRepository;

  constructor() {
    super();
    this.repository = new UserRepository();
    this.serviceName = "UserService";
  }

  async createUsers(metaData: IMetaData): Promise<UserProfileMaster> {
    try {
      if (!metaData.id) {
        throw new AppError(
          "Auth ID is missing in request headers. Cannot create user profile.",
          400,
          true,
          undefined,
          "MISSING_AUTH_ID",
        );
      }
      return await this.repository.createUserProfile(metaData);
    } catch (error) {
      this._handleError(error, "createUsers", { metaData });
      throw error;
    }
  }

  async getAllUsers(
    query: UserListQuery["query"],
  ): Promise<PaginationResult<UserProfileMaster>> {
    try {
      return await this.repository.getAllUser(query);
    } catch (error) {
      this._handleError(error, "getAllUsers", { query });
      throw error;
    }
  }

  async getUserDetails(
    userId: string,
    includeLocations: boolean = false,
  ): Promise<UserProfileMaster> {
    try {
      const includeQuery: any = {
        profile: true,
      };

      if (includeLocations) {
        includeQuery.addresses = {
          where: { isDeleted: false },
        };
      }
      const user = await this.repository.getUserFullDetails(
        userId,
        includeQuery,
      );
      if (!user) {
        throw new AppError(
          "User profile not found",
          404,
          true,
          undefined,
          "USER_NOT_FOUND",
        );
      }
      return user;
    } catch (error) {
      this._handleError(error, "getUserDetails", { userId });
      throw error;
    }
  }

  async updateFullProfile(userId: string, updateData: any) {
    try {
      const includeQuery: any = {
        profile: true,
      };
      const user = await this.repository.getUserFullDetails(
        userId,
        includeQuery,
      );
      if (!user) {
        throw new AppError(
          "User not found",
          404,
          true,
          undefined,
          "USER_NOT_FOUND",
        );
      }
      return await this.repository.updateFullUserProfile(userId, updateData);
    } catch (error) {
      this._handleError(error, "updateFullProfile", { userId, updateData });
      throw error;
    }
  }
}
