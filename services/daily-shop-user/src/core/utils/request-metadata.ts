import { Request } from "express";

export interface IMetaData {
  authId: string | null;
  email: string | null;
  phoneNumber: string | null;
  ipAddress?: string;
  userAgent?: string;
  origin?: string;
  referrer?: string;
  requestId?: string;
}

export function getRequestMetadata(req: Request): IMetaData {
  const authId = req.headers["x-auth-user-id"] as string;
  const email = req.headers["x-auth-email"] as string;
  const phoneNumber = req.headers["x-auth-phone"] as string;

  return {
    authId,
    email,
    phoneNumber,
    ipAddress: req.ip || (req.socket?.remoteAddress as string),
    userAgent: req.headers["user-agent"] as string,
    origin: req.headers["origin"] as string,
    referrer: req.headers["referer"] as string,
    requestId: req.headers["x-request-id"] as string,
  };
}
