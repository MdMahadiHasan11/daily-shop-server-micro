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
      // 🌐 Public Endpoints
      {
        path: "/api/v1/users/public-profile/:id",
        method: "get",
        middlewares: [],
      },

      // 🔒 Protected Endpoints
      {
        path: "/api/v1/users/profile",
        method: "get",
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
