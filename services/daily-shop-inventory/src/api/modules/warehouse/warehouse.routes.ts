import { BaseRoutes } from "../../../core/base/base.routes";
import { WarehouseController } from "./warehouse.controller";
import { WarehouseValidators } from "./warehouse.validator";

export class WarehouseRoutes extends BaseRoutes<WarehouseController> {
  constructor() {
    super(new WarehouseController());
  }

  protected registerRoutes(): void {
    // Bulk operations route (Must be declared before dynamic path parameters)
    this.router.post(
      "/bulk",
      this.validateService.allow(["gateway"]),
      this.validateRequest(WarehouseValidators.bulkOperation),
      this.controller.bulkOperation,
    );

    // Get all warehouses
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(WarehouseValidators.listWarehouses),
      this.controller.getAllWarehouses,
    );

    // Get single warehouse by ID
    this.router.get(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.controller.getWarehouseById,
    );

    // Create warehouse
    this.router.post(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(WarehouseValidators.createWarehouse),
      this.controller.createWarehouse,
    );

    // Update warehouse
    this.router.patch(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(WarehouseValidators.updateWarehouse),
      this.controller.updateWarehouse,
    );

    // Restore warehouse
    this.router.patch(
      "/restore/:id",
      this.validateService.allow(["gateway"]),
      this.controller.restoreWarehouse,
    );

    // Soft delete warehouse
    this.router.delete(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.controller.softDeleteWarehouse,
    );

    // Hard delete warehouse
    this.router.delete(
      "/hard-delete/:id",
      this.validateService.allow(["gateway"]),
      this.controller.hardDeleteWarehouse,
    );
  }
}