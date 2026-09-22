import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { StockBatchService } from "./stock-batch.service";

export class StockBatchController extends BaseController {
  private service: StockBatchService;

  constructor() {
    super();
    this.service = new StockBatchService();
  }

  getAllBatches = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody?.query || req.query;
    const result = await this.service.getAllBatches(query);
    return this.successResponse(res, result.data || result, 200, {
      message:"All Batches get successfully.",
      pagination: result.pagination,
      query
    });
  });

  getBatchById = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.getBatchById(id);
    return this.successResponse(res, result, 200);
  });

  createBatch = this.asyncHandler(async (req: Request, res: Response) => {
    const data = req.validatedBody?.body || req.body;
    const result = await this.service.createBatch(data);
    return this.successResponse(res, result, 201, {
      message: "Stock batch created successfully",
    });
  });

  updateBatch = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const data = req.validatedBody?.body || req.body;
    const result = await this.service.updateBatch(id, data);
    return this.successResponse(res, result, 200, {
      message: "Stock batch updated successfully",
    });
  });

  softDeleteBatch = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.softDeleteBatch(id);
    return this.successResponse(res, result, 200, {
      message: "Stock batch soft deleted successfully",
    });
  });

  restoreBatch = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.restoreBatch(id);
    return this.successResponse(res, result, 200, {
      message: "Stock batch restored successfully",
    });
  });

  hardDeleteBatch = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.hardDeleteBatch(id);
    return this.successResponse(res, result, 200, {
      message: "Stock batch permanently deleted successfully",
    });
  });

  getExpiringBatches = this.asyncHandler(async (req: Request, res: Response) => {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const warehouseId = req.query.warehouseId as string;
    const result = await this.service.getExpiringBatches(days, warehouseId);
    return this.successResponse(res, result, 200, {
      message: "Expiring batches fetched successfully",
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