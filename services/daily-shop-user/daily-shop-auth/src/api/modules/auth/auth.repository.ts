import { BaseRepository } from "../../../core/base/base.repository";
import { UserWithProfile } from "./auth.type";

export class AuthRepository extends BaseRepository<"user"> {
  constructor() {
    super("user");
  }

  async getUserByIdentity(identifier: string): Promise<UserWithProfile | null> {
    return await this.prisma.user.findFirst({
      where: {
        isDeleted: false,
        OR: [
          { email: identifier },
          { phoneNumber: identifier },
          { id: identifier },
        ],
      },
      select: {
        id: true,
        role: true,
        phoneNumber: true,
        phoneNumberVerified: true,
        email: true,
        emailVerified: true,
        emailVerifiedAt: true,
        image: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            genderId: true,
            hasReturnRequests: true,
            reloadLocation: true,
            loyaltyVerified: true,
            dateOfBirth: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async createUserWithProfile(data: {
    phoneNumber?: string | null;
    email?: string | null;
    phoneNumberVerified?: boolean;
    emailVerified?: boolean;
  }): Promise<UserWithProfile> {
    return await this.prisma.user.create({
      data: {
        phoneNumber: data.phoneNumber,
        email: data.email,
        phoneNumberVerified: data.phoneNumberVerified || false,
        emailVerified: data.emailVerified || false,
        profile: {
          create: {
            firstName: "Customer",
          },
        },
      },
      select: {
        id: true,
        role: true,
        phoneNumber: true,
        phoneNumberVerified: true,
        email: true,
        emailVerified: true,
        emailVerifiedAt: true,
        image: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            genderId: true,
            hasReturnRequests: true,
            reloadLocation: true,
            loyaltyVerified: true,
            dateOfBirth: true,
            bio: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }
}
