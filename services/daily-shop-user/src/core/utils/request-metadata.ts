import { Request } from "express";

export interface IMetaData {
  id?: string;
  email?: string;
  phone?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
  origin?: string;
  referrer?: string;
  requestId?: string;
}

export function getRequestMetadata(req: Request): IMetaData {
  const id = (req.headers["x-user-id"] || (req as any).user?.id) as string;
  const email = (req.headers["x-user-email"] ||
    (req as any).user?.email) as string;
  const phone = (req.headers["x-user-phone"] ||
    (req as any).user?.phone) as string;
  const role = (req.headers["x-user-role"] ||
    (req as any).user?.role) as string;

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
    id,
    email,
    phone,
    role,
    ipAddress: clientIp,
    userAgent: (req.headers["user-agent"] as string) || "",
    origin: (req.headers["origin"] as string) || "",
    referrer: (req.headers["referer"] ||
      req.headers["referrer"] ||
      "") as string,
    requestId: (req.headers["x-request-id"] as string) || "",
  };
}
