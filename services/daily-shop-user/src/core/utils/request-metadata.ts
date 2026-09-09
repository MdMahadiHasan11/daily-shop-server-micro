import { Request } from "express";
export interface IMetaData {
  authId?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
  origin?: string;
  referrer?: string;
  requestId?: string;
}

export function getRequestMetadata(req: Request): IMetaData {
  const authId = req.headers["x-user-id"] as string;
  const email = req.headers["x-user-email"] as string;
  const phoneNumber = req.headers["x-user-phone"] as string;
  const role = req.headers["x-user-role"] as string;

  const forwardedFor = req.headers["x-forwarded-for"];
  const clientIp =
    (typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0].trim()
      : null) ||
    (req.headers["x-real-ip"] as string) ||
    req.ip ||
    req.socket?.remoteAddress ||
    "";

  return {
    authId,
    email,
    phoneNumber,
    role,
    ipAddress: clientIp,
    userAgent: req.headers["user-agent"] as string,
    origin: req.headers["origin"] as string,
    referrer: (req.headers["referer"] || req.headers["referrer"]) as string,
    requestId: req.headers["x-request-id"] as string,
  };
}
