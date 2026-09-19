import { env } from "../../config/gateway.config";
import { BaseProxyRoute, RouteDefinition } from "../middlewares/base.proxy";

export class ProductProxyRoute extends BaseProxyRoute {
  protected serviceUrl = env.PRODUCT_SERVICE;

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const routes: RouteDefinition[] = [
      {
        path: "/v1/product-service/categories",
        method: "get",
        // middlewares: [this.middlewares.auth],
      },
      {
        path: "/v1/product-service/categories/:id",
        method: "get",
        // middlewares: [this.middlewares.auth],
      },
      {
        path: "/v1/product-service/categories",
        method: "post",
        // middlewares: [this.middlewares.auth],
      },
      //   category end

      //   brand start

      {
        path: "/v1/product-service/brand",
        method: "get",
        // middlewares: [this.middlewares.auth],
      },
      {
        path: "/v1/product-service/brand/:id",
        method: "get",
        // middlewares: [this.middlewares.auth],
      },
      {
        path: "/v1/product-service/brand",
        method: "post",
        // middlewares: [this.middlewares.auth],
      },

      //   tag stat

      {
        path: "/v1/product-service/tag",
        method: "get",
        // middlewares: [this.middlewares.auth],
      },
      {
        path: "/v1/product-service/tag/:id",
        method: "get",
        // middlewares: [this.middlewares.auth],
      },
      {
        path: "/v1/product-service/tag",
        method: "post",
        // middlewares: [this.middlewares.auth],
      },

      //   product

      {
        path: "/v1/product-service/product",
        method: "get",
        // middlewares: [this.middlewares.auth],
      },

      {
        path: "/v1/product-service/product/:id",
        method: "get",
        // middlewares: [this.middlewares.auth],
      },

      {
        path: "/v1/product-service/product",
        method: "post",
        // middlewares: [this.middlewares.auth],
      },
    ];

    this.registerRoutes(routes);
  }
}
