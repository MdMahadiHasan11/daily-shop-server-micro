import { BaseRoutes } from "../../../core/base/base.routes";
import { StockBatchController } from "./stock-batch.controller";
import { StockBatchValidators } from "./stock-batch.validator";

export class StockBatchRoutes extends BaseRoutes<StockBatchController> {
  constructor() {
    super(new StockBatchController());
  }

  protected registerRoutes(): void {
    // Bulk operations route (Must be declared before dynamic path parameters)
    this.router.post(
      "/bulk",
      this.validateService.allow(["gateway"]),
      this.validateRequest(StockBatchValidators.bulkOperation),
      this.controller.bulkOperation,
    );

    // Get batches expiring soon route
    this.router.get(
      "/alerts/expiring",
      this.validateService.allow(["gateway"]),
      this.validateRequest(StockBatchValidators.expiringQuery),
      this.controller.getExpiringBatches,
    );

    // Get all batches with pagination and filters
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(StockBatchValidators.listBatches),
      this.controller.getAllBatches,
    );

    // Get single batch by ID
    this.router.get(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.controller.getBatchById,
    );

    // Create a new batch
    this.router.post(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(StockBatchValidators.createBatch),
      this.controller.createBatch,
    );

    // Update batch details
    this.router.patch(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(StockBatchValidators.updateBatch),
      this.controller.updateBatch,
    );

    // Restore batch
    this.router.patch(
      "/restore/:id",
      this.validateService.allow(["gateway"]),
      this.controller.restoreBatch,
    );

    // Soft delete batch
    this.router.delete(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.controller.softDeleteBatch,
    );

    // Hard delete batch
    this.router.delete(
      "/hard-delete/:id",
      this.validateService.allow(["gateway"]),
      this.controller.hardDeleteBatch,
    );
  }
}