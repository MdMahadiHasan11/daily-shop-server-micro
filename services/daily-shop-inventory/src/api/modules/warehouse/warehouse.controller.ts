import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { WarehouseService } from "./warehouse.service";

export class WarehouseController extends BaseController {
  private service: WarehouseService;

  constructor() {
    super();
    this.service = new WarehouseService();
  }

  getAllWarehouses = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody?.query || req.query;
    const result = await this.service.getAllWarehouses(query);
    return this.successResponse(res, result.data || result, 200, {
      message:"All warehouse get successfully.",
      pagination: result.pagination,
      query:query
    });
  });

  getWarehouseById = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.getWarehouseById(id);
    return this.successResponse(res, result, 200);
  });

  createWarehouse = this.asyncHandler(async (req: Request, res: Response) => {
    const data = req.validatedBody?.body || req.body;
    const result = await this.service.createWarehouse(data);
    return this.successResponse(res, result, 201, {
      message: "Warehouse created successfully",
    });
  });

  updateWarehouse = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const data = req.validatedBody?.body || req.body;
    const result = await this.service.updateWarehouse(id, data);
    return this.successResponse(res, result, 200, {
      message: "Warehouse updated successfully",
    });
  });

  softDeleteWarehouse = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.softDeleteWarehouse(id);
    return this.successResponse(res, result, 200, {
      message: "Warehouse soft deleted successfully",
    });
  });

  restoreWarehouse = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.restoreWarehouse(id);
    return this.successResponse(res, result, 200, {
      message: "Warehouse restored successfully",
    });
  });

  hardDeleteWarehouse = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.hardDeleteWarehouse(id);
    return this.successResponse(res, result, 200, {
      message: "Warehouse permanently deleted successfully",
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