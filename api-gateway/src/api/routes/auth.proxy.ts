import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { env } from "../../config/gateway.config";
import { authLimiter } from "../middlewares/rate-limiter.middleware";

export class AuthProxyRoute {
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(
      "/",
      authLimiter,
      createProxyMiddleware({
        target: env.AUTH_SERVICE,
        changeOrigin: true,
        pathRewrite: {
          "^/": "/v1/auth/",
        },
      }),
    );
  }
}
