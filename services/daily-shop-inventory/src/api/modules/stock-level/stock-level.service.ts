import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { StockLevelRepository } from "./stock-level.repository";

export class StockLevelService extends BaseService {
  private readonly repository: StockLevelRepository;

  constructor() {
    super();
    this.repository = new StockLevelRepository();
    this.serviceName = "StockLevelService";
  }

  // Get all stock levels with filtering and pagination
  async getAllStockLevels(query: any) {
    try {
      return await this.repository.getList(query, {
        warehouse: true,
        productVariant: true,
      });
    } catch (error) {
      this._handleError(error, "getAllStockLevels", { query });
      throw error;
    }
  }

  // Get specific stock level by ID
  async getStockLevelById(id: string) {
    try {
      const stockLevel = await this.repository.findById(id, {
        warehouse: true,
        productVariant: true,
      });
      if (!stockLevel) {
        throw new AppError("Stock level record not found", 404, true, undefined, "STOCK_LEVEL_NOT_FOUND");
      }
      return stockLevel;
    } catch (error) {
      this._handleError(error, "getStockLevelById", { id });
      throw error;
    }
  }

  // Get stock level by Warehouse and Product Variant
  async getStockByWarehouseAndVariant(warehouseId: string, productVariantId: string) {
    try {
      const stock = await this.repository.findByWarehouseAndVariant(warehouseId, productVariantId);
      if (!stock) {
        throw new AppError("Stock record not found for this warehouse and product variant", 404, true, undefined, "STOCK_NOT_FOUND");
      }
      return stock;
    } catch (error) {
      this._handleError(error, "getStockByWarehouseAndVariant", { warehouseId, productVariantId });
      throw error;
    }
  }

  // Update reorder settings (reorderLevel, reorderQuantity)
  async updateStockThresholds(id: string, data: { reorderLevel?: number; reorderQuantity?: number }) {
    try {
      const stockLevel = await this.repository.findById(id);
      if (!stockLevel) {
        throw new AppError("Stock level record not found", 404, true, undefined, "STOCK_LEVEL_NOT_FOUND");
      }

      const updatePayload: any = {};
      if (data.reorderLevel !== undefined) updatePayload.reorderLevel = data.reorderLevel;
      if (data.reorderQuantity !== undefined) updatePayload.reorderQuantity = data.reorderQuantity;

      return await this.repository.update(id, updatePayload);
    } catch (error) {
      this._handleError(error, "updateStockThresholds", { id, data });
      throw error;
    }
  }

  // Get low stock alerts
  async getLowStockAlerts(warehouseId?: string) {
    try {
      const allStocks = await this.repository.findLowStockItems(warehouseId);
      // Filter items where quantity <= reorderLevel
      const lowStockItems = allStocks.filter((item: any) => item.quantity <= item.reorderLevel);
      return lowStockItems;
    } catch (error) {
      this._handleError(error, "getLowStockAlerts", { warehouseId });
      throw error;
    }
  }
}