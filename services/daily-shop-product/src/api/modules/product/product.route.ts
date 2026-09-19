import { BaseRoutes } from "../../../core/base/base.routes";
import { ProductController } from "./product.controller";
import { ProductValidators } from "./product.validator";

export class ProductRoutes extends BaseRoutes<ProductController> {
  constructor() {
    super(new ProductController());
  }

  protected registerRoutes(): void {
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(ProductValidators.listProducts),
      this.controller.getAllProducts,
    );

    this.router.get(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.controller.getProductById,
    );

    this.router.post(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(ProductValidators.createProduct),
      this.controller.createProduct,
    );
  }
}
