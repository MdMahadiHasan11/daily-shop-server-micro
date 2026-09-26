import { BaseRoutes } from "../../../core/base/base.routes";
import { ProductVariantController } from "./variant.controller";
import { ProductVariantValidators } from "./variant.validator";

export class ProductVariantRoutes extends BaseRoutes<ProductVariantController> {
  constructor() {
    super(new ProductVariantController());
  }

  protected registerRoutes(): void {
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(ProductVariantValidators.listProductsVariant),
      this.controller.getAllProductVariant,
    );

    this.router.get(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(ProductVariantValidators.getParamsId),
      this.controller.getProductVariantById,
    );

    this.router.post(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(ProductVariantValidators.createProductVariant),
      this.controller.createProductVariant,
    );

    this.router.post(
      "/bulk",
      this.validateService.allow(["gateway", "cart", "order", "campaign"]),
      this.validateRequest(ProductVariantValidators.getBulkVariants),
      this.controller.getVariantsByBulk,
    );
  }
}
