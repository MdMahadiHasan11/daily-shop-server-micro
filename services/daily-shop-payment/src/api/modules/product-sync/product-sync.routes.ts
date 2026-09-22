import { BaseRoutes } from "../../../core/base/base.routes";
import { ProductSyncController } from "./product-sync.controller";
// import { ProductSyncController } from "./product-sync.controller";
import { ProductSyncValidators } from "./product-sync.validator";

export class ProductSyncRoutes extends BaseRoutes<ProductSyncController> {
  constructor() {
    super(new ProductSyncController());
  }

  protected registerRoutes(): void {
    this.router.post(
      "/sync",
      this.validateService.allow(["gateway", "product"]),
      this.validateRequest(ProductSyncValidators.syncVariant),
      this.controller.syncVariant,
    );

    // ২. Get all synced variants
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(ProductSyncValidators.listSyncedVariants),
      this.controller.getAllSyncedVariants,
    );

    this.router.get(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(ProductSyncValidators.getVariantById),
      this.controller.getVariantById,
    );
  }
}
