import { env } from "../../config/gateway.config";
import { BaseProxyRoute, RouteDefinition } from "../middlewares/base.proxy";

export class MessageProxyRoute extends BaseProxyRoute {
  protected serviceUrl = env.MESSAGE_SERVICE;

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const routes: RouteDefinition[] = [
      {
        path: "/v1/message/email/templates",
        method: "get",
      },
      {
        path: "/v1/message/email/logs",
        method: "get",
      },
      {
        path: "/v1/message/email/templates",
        method: "post",
      },
      {
        path: "/v1/message/email/templates/:id",
        method: "patch",
      },
      {
        path: "/v1/message/email/templates/:id",
        method: "delete",
      },
    ];

    this.registerRoutes(routes);
  }
}
