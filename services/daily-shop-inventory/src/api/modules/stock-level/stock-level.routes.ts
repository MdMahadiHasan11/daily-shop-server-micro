import { BaseRoutes } from "../../../core/base/base.routes";
import { StockLevelController } from "./stock-level.controller";
import { StockLevelValidators } from "./stock-level.validator";

export class StockLevelRoutes extends BaseRoutes<StockLevelController> {
  constructor() {
    super(new StockLevelController());
  }

  protected registerRoutes(): void {
    this.router.get(
      "/alerts/low-stock",
      this.validateService.allow(["gateway"]),
      this.validateRequest(StockLevelValidators.lowStockQuery),
      this.controller.getLowStockAlerts,
    );

    // Get stock by warehouse and variant combination query
    this.router.get(
      "/lookup",
      this.validateService.allow(["gateway"]),
      this.validateRequest(StockLevelValidators.getStockByQuery),
      this.controller.getStockByWarehouseAndVariant,
    );

    // Get all stock levels with pagination & filters
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(StockLevelValidators.listStockLevels),
      this.controller.getAllStockLevels,
    );

    // Get single stock level by ID
    this.router.get(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.controller.getStockLevelById,
    );

    // Update reorder thresholds for a stock level item
    this.router.patch(
      "/:id/thresholds",
      this.validateService.allow(["gateway"]),
      this.validateRequest(StockLevelValidators.updateThresholds),
      this.controller.updateStockThresholds,
    );

    this.router.get(
      "/stock/batch/expired",
      this.validateService.allow(["gateway", "cart", "order"]),
      this.validateRequest(StockLevelValidators.listStockExpired),
      this.controller.getStockExpired,
    );

    this.router.get(
      "/stock/:productVariantId",
      this.validateService.allow(["gateway", "cart", "order"]),
      this.validateRequest(StockLevelValidators.getStockCheckSchema),
      this.controller.getStockSummaryByVariant,
    );
  }
}
