import { env } from "../../config/gateway.config";
import { BaseProxyRoute, RouteDefinition } from "../middlewares/base.proxy";

export class UserProxyRoute extends BaseProxyRoute {
  protected serviceUrl = env.USER_SERVICE;

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const routes: RouteDefinition[] = [
      {
        path: "/v1/user",
        method: "get",
        middlewares: [this.middlewares.auth],
      },

      {
        path: "/v1/user/me",
        method: "get",
        middlewares: [this.middlewares.localAuth],
      },
      {
        path: "/v1/user/profile",
        method: "patch",
        middlewares: [this.middlewares.auth],
      },
    ];

    this.registerRoutes(routes);
  }
}
