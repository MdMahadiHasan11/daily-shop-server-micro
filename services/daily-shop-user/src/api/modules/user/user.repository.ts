import { UserProfileMaster } from "@prisma/client";
import { PaginationResult } from "../../../common/interfaces";
import { BaseRepository } from "../../../core/base/base.repository";
import { IMetaData } from "../../../core/utils/request-metadata";
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

  async createUserProfile(metaData: IMetaData): Promise<UserProfileMaster> {
    return await this.prisma.$transaction(async (tx) => {
      const userMaster = await tx.userProfileMaster.create({
        data: {
          id: metaData.authId as string,
          email: metaData.email,
          phoneNumber: metaData.phoneNumber,
        },
      });

      await tx.profile.create({
        data: {
          userId: userMaster.id,
        },
      });

      return userMaster;
    });
  }
}
