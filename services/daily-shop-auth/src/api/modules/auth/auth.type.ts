import { UserRole } from "@prisma/client";
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
