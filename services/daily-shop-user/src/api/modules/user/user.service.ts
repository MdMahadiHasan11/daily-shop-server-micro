import { User } from "@prisma/client";
import { PaginationResult } from "../../../common/interfaces";
import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";

import { CACHE_KEYS } from "../../../core/redis/redis.constant";
import { UserRepository } from "./user.repository";
import { UpdateUserBody, UserListQuery } from "./user.validator";

export class UserService extends BaseService {
  private readonly repository: UserRepository;

  constructor() {
    super();
    this.repository = new UserRepository();
    this.serviceName = "UserService";
  }

  async getAllUsers(
    query: UserListQuery["query"],
  ): Promise<PaginationResult<User>> {
    try {
      return await this.repository.getAllUser(query);
    } catch (error) {
      this._handleError(error, "getAllUsers", { query });
      throw error;
    }
  }

  async updateUser(id: string, data: UpdateUserBody["body"]): Promise<User> {
    try {
      const existing = await this.repository.findById<User>(id);
      if (!existing) {
        throw new AppError("User not found or has been deleted.", 400);
      }

      const result = await this.repository.updateUserProfile(id, data);
      await this.cache.delete(CACHE_KEYS.userProfile(id));

      return result;
    } catch (error) {
      this._handleError(error, "updateUser", { id, data });
      throw error;
    }
  }

  async softDeleteUser(id: string): Promise<User> {
    try {
      const isExist = await this.repository.findById<User>(id);
      if (!isExist) {
        throw new AppError("User not found or has been deleted.", 400);
      }
      return await this.repository.softDelete(id, {
        select: {
          id: true,
          role: true,
          phoneNumber: true,
          phoneNumberVerified: true,
          email: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      this._handleError(error, "softDeleteUser", { id });
      throw error;
    }
  }

  async hardDelete(id: string): Promise<UserListQuery> {
    try {
      const isExist = await this.repository.findById<User>(id);
      if (!isExist) {
        throw new AppError("User not found or has been deleted.", 400);
      }
      if (!isExist.isDeleted) {
        throw new AppError("User first soft delete before hard delete", 400);
      }
      return await this.repository.hardDelete(id, {
        select: {
          id: true,
          role: true,
          phoneNumber: true,
          phoneNumberVerified: true,
          email: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      this._handleError(error, "hardDelete", { id });
      throw error;
    }
  }

  async getUserById(id: string): Promise<User> {
    try {
      const isExist = await this.repository.count({ id });
      if (!isExist) {
        throw new AppError("User not found or has been deleted.", 400);
      }
      return await this.repository.getUserById(id);
    } catch (error) {
      this._handleError(error, "getUserById", { id });
      throw error;
    }
  }
}
