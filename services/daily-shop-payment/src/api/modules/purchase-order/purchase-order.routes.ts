import { BaseRoutes } from "../../../core/base/base.routes";
import { PurchaseOrderController } from "./purchase-order.controller";
import { PurchaseOrderValidators } from "./purchase-order.validator";

export class PurchaseOrderRoutes extends BaseRoutes<PurchaseOrderController> {
  constructor() {
    super(new PurchaseOrderController());
  }

  protected registerRoutes(): void {
    // Bulk operations route (Must be declared before dynamic path parameters)
    this.router.post(
      "/bulk",
      this.validateService.allow(["gateway"]),
      this.validateRequest(PurchaseOrderValidators.bulkOperation),
      this.controller.bulkOperation,
    );

    // Get all purchase orders with pagination and filtering
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(PurchaseOrderValidators.listPurchaseOrders),
      this.controller.getAllPurchaseOrders,
    );

    // Get single purchase order by ID
    this.router.get(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.controller.getPurchaseOrderById,
    );

    // Create a new purchase order
    this.router.post(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(PurchaseOrderValidators.createPurchaseOrder),
      this.controller.createPurchaseOrder,
    );

    // Receive purchase order goods
    this.router.patch(
      "/:id/receive",
      this.validateService.allow(["gateway"]),
      this.validateRequest(PurchaseOrderValidators.receivePurchaseOrder),
      this.controller.receivePurchaseOrder,
    );

    // Adjust already received purchase order items & stock
    this.router.patch(
      "/:id/adjust",
      this.validateService.allow(["gateway"]),
      this.validateRequest(PurchaseOrderValidators.adjustPurchaseOrder),
      this.controller.adjustReceivedPurchaseOrder,
    );

    // Update purchase order details
    this.router.patch(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(PurchaseOrderValidators.updatePurchaseOrder),
      this.controller.updatePurchaseOrder,
    );

    // Restore purchase order
    this.router.patch(
      "/restore/:id",
      this.validateService.allow(["gateway"]),
      this.controller.restorePurchaseOrder,
    );

    // Soft delete purchase order
    this.router.delete(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.controller.softDeletePurchaseOrder,
    );

    // Hard delete purchase order
    this.router.delete(
      "/hard-delete/:id",
      this.validateService.allow(["gateway"]),
      this.controller.hardDeletePurchaseOrder,
    );
  }
}
