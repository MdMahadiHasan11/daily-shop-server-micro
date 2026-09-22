import { BaseRoutes } from "../../../core/base/base.routes";
import { StockTransferController } from "./stock-transfer.controller";
import { StockTransferValidators } from "./stock-transfer.validator";

export class StockTransferRoutes extends BaseRoutes<StockTransferController> {
  constructor() {
    super(new StockTransferController());
  }

  protected registerRoutes(): void {
    // Bulk operations route (Must be declared before dynamic path parameters)
    this.router.post(
      "/bulk",
      this.validateService.allow(["gateway"]),
      this.validateRequest(StockTransferValidators.bulkOperation),
      this.controller.bulkOperation,
    );

    // Get all stock transfers with pagination and filtering
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(StockTransferValidators.listTransfers),
      this.controller.getAllTransfers,
    );

    // Get single stock transfer by ID
    this.router.get(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.controller.getTransferById,
    );

    // Create a new stock transfer
    this.router.post(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(StockTransferValidators.createTransfer),
      this.controller.createTransfer,
    );

    // Update transfer status
    this.router.patch(
      "/:id/status",
      this.validateService.allow(["gateway"]),
      this.validateRequest(StockTransferValidators.updateStatus),
      this.controller.updateTransferStatus,
    );

    // Hard delete transfer record
    this.router.delete(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.controller.hardDeleteTransfer,
    );
  }
}