import { NextFunction, Request, Response } from "express";
import { env } from "../../core/config/env.config";

export class validateServiceMiddleware {
  static allow(allowedServices: ("gateway" | "auth" | "user" | "email")[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const secretMap: Record<string, string | undefined> = {
        gateway: env.GATEWAY_SECRET,
      };

      const headerMap: Record<string, string> = {
        gateway: "x-gateway-secret",
      };

      const isAuthorized = allowedServices.some((service) => {
        const expectedSecret = secretMap[service];
        const headerName = headerMap[service];

        const clientSecret = req.headers[headerName];

        return (
          expectedSecret && clientSecret && clientSecret === expectedSecret
        );
      });

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message:
            "Access Denied: Unauthorized Service Call or Missing Secret!",
        });
      }

      next();
    };
  }
}
