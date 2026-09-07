import { User } from "@prisma/client";
import { PaginationResult } from "../../../common/interfaces";
import { BaseRepository } from "../../../core/base/base.repository";
import { UserListQuery } from "./user.validator";

export class UserRepository extends BaseRepository<"user"> {
  constructor() {
    super("user");
  }

  async getUserById(id: string) {
    const user = await this.findById(id);
    if (!user) return null;
    const { password, ...sanitizedUser } = user as any;
    return sanitizedUser;
  }

  async getAllUser(
    query: UserListQuery["query"],
  ): Promise<PaginationResult<User>> {
    const result = await this.getList(query);
    const sanitizedData = result.data.map((user: any) => {
      const { password, ...rest } = user;
      return rest;
    });

    return {
      ...result,
      data: sanitizedData,
    };
  }

  async updateUserProfile(id: string, updateData: any) {
    const {
      firstName,
      lastName,
      genderId,
      dateOfBirth,
      bio,
      image,
      ...userRest
    } = updateData;

    const profileData = {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(genderId !== undefined && { genderId }),
      ...(dateOfBirth !== undefined && {
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      }),
      ...(bio !== undefined && { bio }),
    };

    const updatedUser = await this.update(
      id,
      {
        ...userRest,
        ...(image !== undefined && { image }),
        ...(Object.keys(profileData).length > 0 && {
          profile: {
            upsert: {
              create: profileData,
              update: profileData,
            },
          },
        }),
      },
      {
        include: { profile: true },
      },
    );

    if (!updatedUser) return null;

    const { password, ...sanitizedUser } = updatedUser as any;
    return sanitizedUser;
  }
}
