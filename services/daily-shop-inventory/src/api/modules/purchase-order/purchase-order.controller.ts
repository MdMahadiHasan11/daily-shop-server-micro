import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { PurchaseOrderService } from "./purchase-order.service";

export class PurchaseOrderController extends BaseController {
  private service: PurchaseOrderService;

  constructor() {
    super();
    this.service = new PurchaseOrderService();
  }

  getAllPurchaseOrders = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody?.query || req.query;
    const result = await this.service.getAllPurchaseOrders(query);
    return this.successResponse(res, result.data || result, 200, {
      message:"All purchse order get successfully.",
      pagination: result.pagination,
      query
    });
  });

  getPurchaseOrderById = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.getPurchaseOrderById(id);
    return this.successResponse(res, result, 200);
  });

  createPurchaseOrder = this.asyncHandler(async (req: Request, res: Response) => {
    const data = req.validatedBody?.body || req.body;
    const result = await this.service.createPurchaseOrder(data);
    return this.successResponse(res, result, 201, {
      message: "Purchase order created successfully",
    });
  });

  updatePurchaseOrder = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const data = req.validatedBody?.body || req.body;
    const result = await this.service.updatePurchaseOrder(id, data);
    return this.successResponse(res, result, 200, {
      message: "Purchase order updated successfully",
    });
  });

  receivePurchaseOrder = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const data = req.validatedBody?.body || req.body;
    const result = await this.service.receivePurchaseOrder(id, data);
    return this.successResponse(res, result, 200, {
      message: "Purchase order goods received successfully",
    });
  });

  softDeletePurchaseOrder = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.softDeletePurchaseOrder(id);
    return this.successResponse(res, result, 200, {
      message: "Purchase order soft deleted successfully",
    });
  });

  restorePurchaseOrder = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.restorePurchaseOrder(id);
    return this.successResponse(res, result, 200, {
      message: "Purchase order restored successfully",
    });
  });

  hardDeletePurchaseOrder = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.hardDeletePurchaseOrder(id);
    return this.successResponse(res, result, 200, {
      message: "Purchase order permanently deleted successfully",
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