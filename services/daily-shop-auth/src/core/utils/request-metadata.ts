import { Request } from "express";
import { IUser } from "../../types/global";

export interface IMetaData {
  userId: string;
  email: string | null;
  phoneNumber: string | null;
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

  return {
    userId: user?.userId,
    email: user?.email,
    phoneNumber: user?.phoneNumber,
    jti: user?.jti,
    role: user?.role,

    ipAddress: req.ip || (req.socket?.remoteAddress as string),
    userAgent: req.headers["user-agent"] as string,
    origin: req.headers["origin"],
    referrer: req.headers["referer"],
    requestId: req.headers["x-request-id"] as string,
  };
}
