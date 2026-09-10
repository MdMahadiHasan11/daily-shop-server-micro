import { env } from "../../config/gateway.config";
import { BaseProxyRoute, RouteDefinition } from "../middlewares/base.proxy";

export class AuthProxyRoute extends BaseProxyRoute {
  protected serviceUrl = env.AUTH_SERVICE;

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // const authMiddleware = middlewares.auth;

    const routes: RouteDefinition[] = [
      {
        path: "/v1/auth/login-register-initiate",
        method: "post",
        middlewares: [],
      },
      {
        path: "/v1/auth/login-register",
        method: "post",
        // middlewares: [authMiddleware],
      },
      {
        path: "/v1/auth/me",
        method: "get",
        // middlewares: [authMiddleware],
      },
      {
        path: "/v1/auth/logout",
        method: "post",
        // middlewares: [authMiddleware],
      },
    ];

    this.registerRoutes(routes);
  }
}
