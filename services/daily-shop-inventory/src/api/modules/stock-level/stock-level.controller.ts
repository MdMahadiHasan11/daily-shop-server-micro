import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { StockLevelService } from "./stock-level.service";

export class StockLevelController extends BaseController {
  private service: StockLevelService;

  constructor() {
    super();
    this.service = new StockLevelService();
  }

  getAllStockLevels = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody?.query || req.query;
    const result = await this.service.getAllStockLevels(query);
    return this.successResponse(res, result, 200, {
      message: "All stock Levels get successfully.",
      pagination: result.pagination,
      query,
    });
  });

  getStockLevelById = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.getStockLevelById(id);
    return this.successResponse(res, result, 200);
  });

  getStockByWarehouseAndVariant = this.asyncHandler(
    async (req: Request, res: Response) => {
      const { warehouseId, productVariantId } = req.query;
      const result = await this.service.getStockByWarehouseAndVariant(
        warehouseId as string,
        productVariantId as string,
      );
      return this.successResponse(res, result, 200);
    },
  );

  updateStockThresholds = this.asyncHandler(
    async (req: Request, res: Response) => {
      const id = req.validatedBody?.params?.id || req.params.id;
      const data = req.validatedBody?.body || req.body;
      const result = await this.service.updateStockThresholds(id, data);
      return this.successResponse(res, result, 200, {
        message: "Stock thresholds updated successfully",
      });
    },
  );

  getLowStockAlerts = this.asyncHandler(async (req: Request, res: Response) => {
    const warehouseId = req.query.warehouseId as string;
    const result = await this.service.getLowStockAlerts(warehouseId);
    return this.successResponse(res, result, 200, {
      message: "Low stock alerts fetched successfully",
    });
  });

  getStockSummaryByVariant = this.asyncHandler(
    async (req: Request, res: Response) => {
      const productVariantId = req.params.productVariantId;
      const result = await this.service.getStockSummaryByVariant(
        productVariantId as string,
      );
      return this.successResponse(res, result, 200, {
        message: "Stock details fetched successfully",
      });
    },
  );
}
