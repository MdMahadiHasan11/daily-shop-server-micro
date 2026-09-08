import { NextFunction, Request, Response } from "express";
import { env } from "../../core/config/env.config";

export class authenticate {
  static allow(allowedServices: ("gateway" | "auth" | "email")[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientSecret = req.headers["x-internal-secret"];

      if (!clientSecret) {
        return res.status(403).json({
          success: false,
          message: "Access Denied: No Internal Secret Provided!",
        });
      }

      const secretMap: Record<string, string | undefined> = {
        gateway: env.GATEWAY_SECRET,
        auth: env.AUTH_SECRET,
        email: env.EMAIL_SECRET,
      };

      const isAuthorized = allowedServices.some((service) => {
        const expectedSecret = secretMap[service];
        return expectedSecret && clientSecret === expectedSecret;
      });

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: "Access Denied: Unauthorized Service Call!",
        });
      }

      next();
    };
  }
}
