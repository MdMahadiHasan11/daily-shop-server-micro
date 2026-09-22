import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { StockTransferService } from "./stock-transfer.service";

export class StockTransferController extends BaseController {
  private service: StockTransferService;

  constructor() {
    super();
    this.service = new StockTransferService();
  }

  getAllTransfers = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody?.query || req.query;
    const result = await this.service.getAllTransfers(query);
    return this.successResponse(res, result.data || result, 200, {
      pagination: result.pagination,
    });
  });

  getTransferById = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.getTransferById(id);
    return this.successResponse(res, result, 200);
  });

  createTransfer = this.asyncHandler(async (req: Request, res: Response) => {
    const data = req.validatedBody?.body || req.body;
    const result = await this.service.createTransfer(data);
    return this.successResponse(res, result, 201, {
      message: "Stock transfer request created successfully",
    });
  });

  updateTransferStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const { status, notes } = req.validatedBody?.body || req.body;
    const result = await this.service.updateTransferStatus(id, status, notes);
    return this.successResponse(res, result, 200, {
      message: "Stock transfer status updated successfully",
    });
  });

  hardDeleteTransfer = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.hardDeleteTransfer(id);
    return this.successResponse(res, result, 200, {
      message: "Stock transfer record permanently deleted successfully",
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