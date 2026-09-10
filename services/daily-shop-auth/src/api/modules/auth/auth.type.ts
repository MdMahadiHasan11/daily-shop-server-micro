import { UserRole } from "@prisma/client";
export interface ISession {
  id: string;
  role: UserRole;
  email: string | null;
  phone: string | null;
  userAgent: string;
  ipAddress: string;
  valid: boolean;
}
export interface IUserJwtPayload {
  id: string;
  role: UserRole;
  email: string | null;
  phone: string | null;
  jti: string;
  iat: number;
  exp: number;
}
