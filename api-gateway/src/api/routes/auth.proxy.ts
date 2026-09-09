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
        path: "/api/v1/users/profile",
        method: "put",
        // middlewares: [authMiddleware],
      },
    ];

    this.registerRoutes(routes);
  }
}
