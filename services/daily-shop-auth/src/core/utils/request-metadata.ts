import { Request } from "express";
import { IUser } from "../../types/global";

export interface IMetaData {
  id: string;
  email: string | null;
  phone: string | null;
  jti: string | null;
  role: string;
  ipAddress: string;
  userAgent: string;
  origin?: string;
  referrer?: string;
  requestId?: string;
  [key: string]: any;
}

export function getRequestMetadata(req: Request): IMetaData {
  const user = (req as any).user as IUser;
  const ipAddress =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    (req.socket?.remoteAddress as string);

  return {
    id: user?.id,
    email: user?.email,
    phone: user?.phone,
    jti: user?.jti,
    role: user?.role,

    ipAddress,
    userAgent: req.headers["user-agent"] as string,
    origin: req.headers["origin"] as string,
    referrer: req.headers["referer"] as string,
    requestId: req.headers["x-request-id"] as string,
  };
}
