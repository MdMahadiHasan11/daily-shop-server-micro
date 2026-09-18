import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { ProductSyncService } from "./product-sync.service";

export class ProductSyncController extends BaseController {
  private service: ProductSyncService;

  constructor() {
    super();
    this.service = new ProductSyncService();
  }

  // Sync variant endpoint handler
  syncVariant = this.asyncHandler(async (req: Request, res: Response) => {
    const data = req.validatedBody?.body || req.body;
    const result = await this.service.syncProductVariant(data);
    return this.successResponse(res, result, 200, {
      message: "Product variant synchronized successfully",
    });
  });

  // Get variant by ID handler
  getVariantById = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.getSyncedVariantById(id);
    return this.successResponse(res, result, 200, {
      message: "Product variant retrieved successfully",
    });
  });
}