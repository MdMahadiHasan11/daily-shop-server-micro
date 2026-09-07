import { UserProfileMaster } from "@prisma/client";
import { PaginationResult } from "../../../common/interfaces";
import { BaseService } from "../../../core/base/base.service";

import { UserRepository } from "./user.repository";
import { UserListQuery } from "./user.validator";

export class UserService extends BaseService {
  private readonly repository: UserRepository;

  constructor() {
    super();
    this.repository = new UserRepository();
    this.serviceName = "UserService";
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
}
