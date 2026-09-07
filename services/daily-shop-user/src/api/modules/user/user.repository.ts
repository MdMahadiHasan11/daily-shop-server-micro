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
    return await this.transaction(async (tx) => {
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

  async getUserFullDetails(userId: string, include: any) {
    return await this.model.findUnique({
      where: { id: userId, isDeleted: false },
      include,
    });
  }

  async updateFullUserProfile(userId: string, updateData: any) {
    return await this.transaction(async (tx) => {
      const { image, email, phoneNumber, profile, addresses } = updateData;

      const masterData: any = {};
      if (image !== undefined) masterData.image = image;
      if (email !== undefined) masterData.email = email;
      if (phoneNumber !== undefined) masterData.phoneNumber = phoneNumber;

      if (Object.keys(masterData).length > 0) {
        await tx.userProfileMaster.update({
          where: { id: userId },
          data: masterData,
        });
      }

      // . Profile
      if (profile) {
        if (profile.dateOfBirth && typeof profile.dateOfBirth === "string") {
          profile.dateOfBirth = new Date(profile.dateOfBirth);
        }

        await tx.profile.upsert({
          where: { userId },
          update: profile,
          create: { userId, ...profile },
        });
      }

      // 3. Address
      if (addresses && Array.isArray(addresses)) {
        for (const addr of addresses) {
          if (addr.id) {
            const { id, ...addrFields } = addr;
            await tx.address.updateMany({
              where: { id, userId },
              data: addrFields,
            });
          } else {
            if (!addr.isDeleted) {
              await tx.address.create({
                data: {
                  ...addr,
                  userId,
                },
              });
            }
          }
        }
      }

      return await tx.userProfileMaster.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          addresses: {
            where: { isDeleted: false },
          },
        },
      });
    });
  }
}
