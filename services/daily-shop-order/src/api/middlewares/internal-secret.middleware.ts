import { NextFunction, Request, Response } from "express";
import { env } from "../../core/config/env.config";

export class authenticate {
  static allow(
    allowedServices: ("gateway" | "auth" | "user" | "email" | "cart")[],
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      const secretMap: Record<string, string | undefined> = {
        gateway: env.GATEWAY_SECRET,
        email: env.EMAIL_SECRET,
        cart: env.CART_SECRET,
      };

      // Map service names to their expected header keys
      const headerMap: Record<string, string> = {
        gateway: "x-gateway-secret",
        auth: "x-auth-secret",
        user: "x-user-secret",
        email: "x-email-secret",
        cart: "x-cart-secret",
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
