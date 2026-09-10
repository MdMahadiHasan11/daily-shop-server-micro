import { env } from "../../config/gateway.config";
import { BaseProxyRoute, RouteDefinition } from "../middlewares/base.proxy";

export class UserProxyRoute extends BaseProxyRoute {
  protected serviceUrl = env.USER_SERVICE;

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // const authMiddleware = middlewares.auth;

    const routes: RouteDefinition[] = [
      {
        path: "/v1/user",
        method: "get",
        middlewares: [],
      },

      {
        path: "/v1/user/me",
        method: "get",
        // middlewares: [authMiddleware],
      },
      {
        path: "/v1/user/profile",
        method: "patch",
        // middlewares: [authMiddleware],
      },
    ];

    this.registerRoutes(routes);
  }
}
