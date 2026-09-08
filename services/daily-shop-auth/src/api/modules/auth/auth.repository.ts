import { AuthProvider, Session, User } from "@prisma/client";
import { BaseRepository } from "../../../core/base/base.repository";

export class AuthRepository extends BaseRepository<"user"> {
  constructor() {
    super("user");
  }

  async getUserByIdentity(identifier: string): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: {
        isDeleted: false,
        OR: [
          { email: identifier },
          { phoneNumber: identifier },
          { id: identifier },
        ],
      },
    });
  }

  async createUserWithProfileAndAccount(data: {
    phoneNumber?: string | null;
    email?: string | null;
    phoneNumberVerified?: boolean;
    emailVerified?: boolean;
    provider?: AuthProvider;
    providerAccountId?: string;
  }): Promise<User> {
    const provider =
      data.provider ||
      (data.phoneNumber ? AuthProvider.PHONE : AuthProvider.LOCAL);
    const providerAccountId =
      data.providerAccountId || data.phoneNumber || data.email || "";

    return await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          phoneNumber: data.phoneNumber,
          email: data.email,
          phoneNumberVerified: data.phoneNumberVerified || false,
          emailVerified: data.emailVerified || false,
        },
      });
      await tx.account.create({
        data: {
          userId: newUser.id,
          provider: provider,
          providerAccountId: providerAccountId,
        },
      });

      return newUser;
    });
  }

  async createUserSession(data: {
    userId: string;
    sessionToken: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: Date;
  }): Promise<Session> {
    return await this.prisma.session.create({
      data: {
        userId: data.userId,
        sessionToken: data.sessionToken,
        userAgent: data.userAgent || null,
        ipAddress: data.ipAddress || null,
        expiresAt: data.expiresAt,
        isRevoked: false,
      },
    });
  }

  async updateUserSessionStatusByToken(
    sessionToken: string,
    isRevoked: boolean = true,
  ): Promise<any> {
    return await this.prisma.session.updateMany({
      where: {
        sessionToken: sessionToken,
      },
      data: {
        isRevoked: isRevoked,
      },
    });
  }
}
