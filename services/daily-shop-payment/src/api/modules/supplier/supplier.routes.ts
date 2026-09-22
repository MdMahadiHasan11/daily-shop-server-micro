import { BaseRoutes } from "../../../core/base/base.routes";
import { SupplierController } from "./supplier.controller";
import { SupplierValidators } from "./supplier.validator";

export class SupplierRoutes extends BaseRoutes<SupplierController> {
  constructor() {
    super(new SupplierController());
  }

  protected registerRoutes(): void {
    // Bulk operations route (Must be declared before dynamic path parameters)
    this.router.post(
      "/bulk",
      this.validateService.allow(["gateway"]),
      this.validateRequest(SupplierValidators.bulkOperation),
      this.controller.bulkOperation,
    );

    // Get all suppliers
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(SupplierValidators.listSuppliers),
      this.controller.getAllSuppliers,
    );

    // Get single supplier by ID
    this.router.get(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.controller.getSupplierById,
    );

    // Create supplier
    this.router.post(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(SupplierValidators.createSupplier),
      this.controller.createSupplier,
    );

    // Update supplier
    this.router.patch(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(SupplierValidators.updateSupplier),
      this.controller.updateSupplier,
    );

    // Restore supplier
    this.router.patch(
      "/restore/:id",
      this.validateService.allow(["gateway"]),
      this.controller.restoreSupplier,
    );

    // Soft delete supplier
    this.router.delete(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.controller.softDeleteSupplier,
    );

    // Hard delete supplier
    this.router.delete(
      "/hard-delete/:id",
      this.validateService.allow(["gateway"]),
      this.controller.hardDeleteSupplier,
    );
  }
}