import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { env } from "../../config/gateway.config";
import { verifyAuthAndInjectHeaders } from "../middlewares/auth.middleware";

export class UserProxyRoute {
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use(
      "/",
      verifyAuthAndInjectHeaders,
      createProxyMiddleware({
        target: env.USER_SERVICE,
        changeOrigin: true,
      }),
    );
  }
}
