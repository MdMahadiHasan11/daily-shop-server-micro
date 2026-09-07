import { UserProfileMaster } from "@prisma/client";
import { PaginationResult } from "../../../common/interfaces";
import { BaseRepository } from "../../../core/base/base.repository";
import { UserListQuery } from "./user.validator";

export class UserRepository extends BaseRepository<"userProfileMaster"> {
  constructor() {
    super("userProfileMaster");
  }

  async getUserById(id: string) {
    return await this.findById(id);
  }

  async getAllUser(
    query: UserListQuery["query"],
  ): Promise<PaginationResult<UserProfileMaster>> {
    return await this.getList(query);
  }
}
