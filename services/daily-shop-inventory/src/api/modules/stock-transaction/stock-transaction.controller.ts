import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { StockTransactionService } from "./stock-transaction.service";

export class StockTransactionController extends BaseController {
  private service: StockTransactionService;

  constructor() {
    super();
    this.service = new StockTransactionService();
  }

  getAllTransactions = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody?.query || req.query;
    const result = await this.service.getAllTransactions(query);
    return this.successResponse(res, result.data || result, 200, {
      message:"All transaction get successfully.s",
      pagination: result.pagination,
      query
    });
  });

  getTransactionById = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.getTransactionById(id);
    return this.successResponse(res, result, 200);
  });

  createTransaction = this.asyncHandler(async (req: Request, res: Response) => {
    const data = req.validatedBody?.body || req.body;
    const result = await this.service.createTransaction(data);
    return this.successResponse(res, result, 201, {
      message: "Stock transaction ledger entry created successfully",
    });
  });
}