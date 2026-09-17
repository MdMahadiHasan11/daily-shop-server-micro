import { env } from "../../config/gateway.config";
import { BaseProxyRoute, RouteDefinition } from "../middlewares/base.proxy";

export class FileProxyRoute extends BaseProxyRoute {
  protected serviceUrl = env.FILE_SERVICE;

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const routes: RouteDefinition[] = [
      {
        path: "/api/v1/files/upload",
        method: "post",
        // middlewares: [this.middlewares.auth],
      },

      {
        path: "/api/v1/files/upload/multiple",
        method: "post",
        middlewares: [this.middlewares.localAuth],
      },
      {
        path: "/api/v1/files/upload/pdf",
        method: "post",
        middlewares: [this.middlewares.localAuth],
      },
      {
        path: "/api/v1/files/delete",
        method: "delete",
        middlewares: [this.middlewares.localAuth],
      },
      {
        path: "/api/v1/files/delete-folder/:name",
        method: "delete",
        middlewares: [this.middlewares.localAuth],
      },
    ];

    this.registerRoutes(routes);
  }
}
