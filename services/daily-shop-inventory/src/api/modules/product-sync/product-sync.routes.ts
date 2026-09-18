import { BaseRoutes } from "../../../core/base/base.routes";
import { ProductSyncController } from "./product-sync.controller";
// import { ProductSyncController } from "./product-sync.controller";
import { ProductSyncValidators } from "./product-sync.validator";

export class ProductSyncRoutes extends BaseRoutes<ProductSyncController> {
  constructor() {
    super(new ProductSyncController());
  }

  protected registerRoutes(): void {
    // Sync (Create or Update) product variant from product service
    this.router.post(
      "/sync",
      this.validateService.allow(["gateway"]),
      this.validateRequest(ProductSyncValidators.syncVariant),
      this.controller.syncVariant,
    );

    // Get single synced variant by ID
    this.router.get(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(ProductSyncValidators.getVariantById),
      this.controller.getVariantById,
    );
  }
}