import { BaseRoutes } from "../../../core/base/base.routes";
import { BrandController } from "./brand.controller";
import { BrandValidators } from "./brand.validator";

export class BrandRoutes extends BaseRoutes<BrandController> {
  constructor() {
    super(new BrandController());
  }

  protected registerRoutes(): void {
    // Bulk operation route (Must be placed before /:id to avoid route collision)
    this.router.post(
      "/bulk",
      this.validateService.allow(["gateway"]),
      this.validateRequest(BrandValidators.bulkOperation),
      this.controller.bulkOperation,
    );

    // Get all brands
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(BrandValidators.listBrands),
      this.controller.getAllBrands,
    );

    // Get single brand by ID
    this.router.get(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.controller.getBrandById,
    );

   
    // create 
    this.router.post(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(BrandValidators.createBrand),
      this.controller.createBrand,
    );

    this.router.patch(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.validateRequest(BrandValidators.updateBrand),
      this.controller.updateBrand,
    );

    // Restore brand
    this.router.patch(
      "/restore/:id",
      this.validateService.allow(["gateway"]),
      this.controller.restoreBrand,
    );

    // Soft delete brand
    this.router.delete(
      "/:id",
      this.validateService.allow(["gateway"]),
      this.controller.softDeleteBrand,
    );

    // Hard delete brand
    this.router.delete(
      "/hard-delete/:id",
      this.validateService.allow(["gateway"]),
      this.controller.hardDeleteBrand,
    );
  }
}