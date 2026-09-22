import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { SupplierService } from "./supplier.service";

export class SupplierController extends BaseController {
  private service: SupplierService;

  constructor() {
    super();
    this.service = new SupplierService();
  }

  getAllSuppliers = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody?.query || req.query;
    const result = await this.service.getAllSuppliers(query);
    return this.successResponse(res, result.data || result, 200, {
      message:"Get all supplier successfully.",
      pagination: result.pagination,
      query
    });
  });

  getSupplierById = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.getSupplierById(id);
    return this.successResponse(res, result, 200);
  });

  createSupplier = this.asyncHandler(async (req: Request, res: Response) => {
    const data = req.validatedBody?.body || req.body;
    const result = await this.service.createSupplier(data);
    return this.successResponse(res, result, 201, {
      message: "Supplier created successfully",
    });
  });

  updateSupplier = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const data = req.validatedBody?.body || req.body;
    const result = await this.service.updateSupplier(id, data);
    return this.successResponse(res, result, 200, {
      message: "Supplier updated successfully",
    });
  });

  softDeleteSupplier = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.softDeleteSupplier(id);
    return this.successResponse(res, result, 200, {
      message: "Supplier soft deleted successfully",
    });
  });

  restoreSupplier = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.restoreSupplier(id);
    return this.successResponse(res, result, 200, {
      message: "Supplier restored successfully",
    });
  });

  hardDeleteSupplier = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.hardDeleteSupplier(id);
    return this.successResponse(res, result, 200, {
      message: "Supplier permanently deleted successfully",
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