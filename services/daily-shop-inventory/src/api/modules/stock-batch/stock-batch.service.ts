import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { StockBatchRepository } from "./stock-batch.repository";

export class StockBatchService extends BaseService {
  private readonly repository: StockBatchRepository;

  constructor() {
    super();
    this.repository = new StockBatchRepository();
    this.serviceName = "StockBatchService";
  }

  // Get all stock batches with pagination and filtering
  async getAllBatches(query: any) {
    try {
      return await this.repository.getList(query, {
        warehouse: true,
        productVariant: true,
      });
    } catch (error) {
      this._handleError(error, "getAllBatches", { query });
      throw error;
    }
  }

  // Get single batch by ID
  async getBatchById(id: string) {
    try {
      const batch = await this.repository.findById(id, {
        warehouse: true,
        productVariant: true,
      });
      if (!batch) {
        throw new AppError("Stock batch not found", 404, true, undefined, "STOCK_BATCH_NOT_FOUND");
      }
      return batch;
    } catch (error) {
      this._handleError(error, "getBatchById", { id });
      throw error;
    }
  }

  // Create a new stock batch (Lot entry during stock-in)
  async createBatch(data: any) {
    try {
      // Check if batchNumber already exists
      const existingBatch = await this.repository.findByBatchNumber(data.batchNumber);
      if (existingBatch) {
        throw new AppError("A batch with this batch number already exists", 400, true, undefined, "DUPLICATE_BATCH_NUMBER");
      }

      // Ensure currentQuantity defaults to initialQuantity if not provided
      if (data.currentQuantity === undefined) {
        data.currentQuantity = data.initialQuantity;
      }

      return await this.repository.create(data, {
        warehouse: true,
        productVariant: true,
      });
    } catch (error) {
      this._handleError(error, "createBatch", { data });
      throw error;
    }
  }

  // Update batch details (e.g. quantities or expiry date adjustments)
  async updateBatch(id: string, data: any) {
    try {
      const batch = await this.repository.findByIdIncludingDeleted(id);
      if (!batch) {
        throw new AppError("Stock batch not found", 404, true, undefined, "STOCK_BATCH_NOT_FOUND");
      }

      const { currentQuantity, purchasePrice, mfgDate, expiryDate, isDeleted } = data;
      const updatePayload: any = {};

      if (currentQuantity !== undefined) updatePayload.currentQuantity = currentQuantity;
      if (purchasePrice !== undefined) updatePayload.purchasePrice = purchasePrice;
      if (mfgDate !== undefined) updatePayload.mfgDate = mfgDate ? new Date(mfgDate) : null;
      if (expiryDate !== undefined) updatePayload.expiryDate = expiryDate ? new Date(expiryDate) : null;
      if (isDeleted !== undefined) updatePayload.isDeleted = isDeleted;

      return await this.repository.update(id, updatePayload);
    } catch (error) {
      this._handleError(error, "updateBatch", { id, data });
      throw error;
    }
  }

  // Soft delete batch
  async softDeleteBatch(id: string) {
    try {
      const batch = await this.repository.findByIdIncludingDeleted(id);
      if (!batch) {
        throw new AppError("Stock batch not found", 404, true, undefined, "STOCK_BATCH_NOT_FOUND");
      }
      if (batch.isDeleted) {
        throw new AppError("Stock batch is already deleted", 400, true, undefined, "STOCK_BATCH_ALREADY_DELETED");
      }
      return await this.repository.update(id, { isDeleted: true });
    } catch (error) {
      this._handleError(error, "softDeleteBatch", { id });
      throw error;
    }
  }

  // Restore soft-deleted batch
  async restoreBatch(id: string) {
    try {
      const batch = await this.repository.findByIdIncludingDeleted(id);
      if (!batch) {
        throw new AppError("Stock batch not found", 404, true, undefined, "STOCK_BATCH_NOT_FOUND");
      }
      if (!batch.isDeleted) {
        throw new AppError("Stock batch is not deleted yet", 400, true, undefined, "STOCK_BATCH_NOT_DELETED");
      }
      return await this.repository.update(id, { isDeleted: false });
    } catch (error) {
      this._handleError(error, "restoreBatch", { id });
      throw error;
    }
  }

  // Hard delete batch (permanently remove)
  async hardDeleteBatch(id: string) {
    try {
      const batch = await this.repository.findByIdIncludingDeleted(id);
      if (!batch) {
        throw new AppError("Stock batch not found", 404, true, undefined, "STOCK_BATCH_NOT_FOUND");
      }
      if (!batch.isDeleted) {
        throw new AppError("Stock batch must be soft deleted before permanent deletion", 400, true, undefined, "STOCK_BATCH_NOT_SOFT_DELETED");
      }
      return await this.repository.hardDelete(id);
    } catch (error) {
      this._handleError(error, "hardDeleteBatch", { id });
      throw error;
    }
  }

  // Get batches approaching expiration within N days
  async getExpiringBatches(days: number = 30, warehouseId?: string) {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + days);

      return await this.repository.findExpiringBatches(thresholdDate, warehouseId);
    } catch (error) {
      this._handleError(error, "getExpiringBatches", { days, warehouseId });
      throw error;
    }
  }

  // Bulk operations (soft-delete, restore, hard-delete)
  async handleBulkOperation(payload: { ids: string[]; action: "soft-delete" | "restore" | "hard-delete" }) {
    try {
      const { ids, action } = payload;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new AppError("Invalid or empty IDs array provided", 400, true, undefined, "INVALID_IDS");
      }

      if (action === "soft-delete") {
        return await this.repository.updateManyStatus(ids, true);
      } else if (action === "restore") {
        return await this.repository.updateManyStatus(ids, false);
      } else if (action === "hard-delete") {
        return await this.repository.hardDeleteMany(ids);
      } else {
        throw new AppError("Invalid bulk action specified", 400, true, undefined, "INVALID_ACTION");
      }
    } catch (error) {
      this._handleError(error, "handleBulkOperation", { payload });
      throw error;
    }
  }
}