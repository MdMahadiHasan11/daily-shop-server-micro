import { Prisma, UserRole } from "@prisma/client";
export interface ISession {
  userId: string;
  role: UserRole;
  email: string | null;
  phoneNumber: string | null;
  userAgent: string;
  ipAddress: string;
  valid: boolean;
}
export interface IUserJwtPayload {
  userId: string;
  role: UserRole;
  email: string | null;
  phoneNumber: string | null;
  jti: string;
  iat: number;
  exp: number;
}

export type UserWithProfile = Prisma.UserGetPayload<{
  select: {
    id: true;
    role: true;
    phoneNumber: true;
    phoneNumberVerified: true;
    email: true;
    emailVerified: true;
    emailVerifiedAt: true;
    image: true;
    isDeleted: true;
    createdAt: true;
    updatedAt: true;
    profile: {
      select: {
        id: true;
        userId: true;
        firstName: true;
        lastName: true;
        genderId: true;
        hasReturnRequests: true;
        reloadLocation: true;
        loyaltyVerified: true;
        dateOfBirth: true;
        bio: true;
        createdAt: true;
        updatedAt: true;
      };
    };
  };
}>;
