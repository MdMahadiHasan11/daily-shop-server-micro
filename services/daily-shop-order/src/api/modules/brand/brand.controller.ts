import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { BrandService } from "./brand.service";

export class BrandController extends BaseController {
  private service: BrandService;

  constructor() {
    super();
    this.service = new BrandService();
  }

  getAllBrands = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody?.query || req.query;
    const result = await this.service.getAllBrands(query);
    return this.successResponse(res, result.data || result, 200, {
      pagination: result.pagination,
    });
  });

  getBrandById = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.getBrandById(id);
    return this.successResponse(res, result, 200);
  });

  createBrand = this.asyncHandler(async (req: Request, res: Response) => {
    const data = req.validatedBody?.body || req.body;
    const result = await this.service.createBrand(data);
    return this.successResponse(res, result, 201, {
      message: "Brand created successfully",
    });
  });

  updateBrand = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const data = req.validatedBody?.body || req.body;
    const result = await this.service.updateBrand(id, data);
    return this.successResponse(res, result, 200, {
      message: "Brand updated successfully",
    });
  });

  softDeleteBrand = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.softDeleteBrand(id);
    return this.successResponse(res, result, 200, {
      message: "Brand soft deleted successfully",
    });
  });

  restoreBrand = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.restoreBrand(id);
    return this.successResponse(res, result, 200, {
      message: "Brand restored successfully",
    });
  });

  hardDeleteBrand = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.hardDeleteBrand(id);
    return this.successResponse(res, result, 200, {
      message: "Brand permanently deleted successfully",
    });
  });

  bulkOperation = this.asyncHandler(async (req: Request, res: Response) => {
    const payload = req.validatedBody?.body || req.body;
    const result = await this.service.handleBulkOperation(payload);
    return this.successResponse(res, result, 200, {
      message: "Bulk operation executed successfully",
    });
  });
}