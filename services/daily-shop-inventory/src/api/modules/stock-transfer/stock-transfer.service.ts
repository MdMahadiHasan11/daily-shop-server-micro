import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { StockTransferRepository } from "./stock-transfer.repository";

export class StockTransferService extends BaseService {
  private readonly repository: StockTransferRepository;

  constructor() {
    super();
    this.repository = new StockTransferRepository();
    this.serviceName = "StockTransferService";
  }

  // Get all stock transfers with pagination and filtering
  async getAllTransfers(query: any) {
    try {
      return await this.repository.getList(query, {
        fromWarehouse: true,
        toWarehouse: true,
        items: {
          include: {
            productVariant: true,
          },
        },
      });
    } catch (error) {
      this._handleError(error, "getAllTransfers", { query });
      throw error;
    }
  }

  // Get single stock transfer by ID
  async getTransferById(id: string) {
    try {
      const transfer = await this.repository.findByIdWithRelations(id);
      if (!transfer) {
        throw new AppError("Stock transfer not found", 404, true, undefined, "TRANSFER_NOT_FOUND");
      }
      return transfer;
    } catch (error) {
      this._handleError(error, "getTransferById", { id });
      throw error;
    }
  }

  // Create a new stock transfer request
  async createTransfer(data: any) {
    try {
      // Check if transfer number is unique
      const existingTransfer = await this.repository.findByTransferNumber(data.transferNumber);
      if (existingTransfer) {
        throw new AppError("A transfer with this transfer number already exists", 400, true, undefined, "DUPLICATE_TRANSFER_NUMBER");
      }

      if (data.fromWarehouseId === data.toWarehouseId) {
        throw new AppError("Source warehouse and destination warehouse cannot be the same", 400, true, undefined, "INVALID_WAREHOUSE_DESTINATION");
      }

      const { items, ...transferData } = data;

      const formattedItems = items.map((item: any) => ({
        productVariantId: item.productVariantId,
        quantity: item.quantity,
      }));

      const payload = {
        ...transferData,
        status: transferData.status || "PENDING",
        items: {
          create: formattedItems,
        },
      };

      return await this.repository.create(payload, {
        fromWarehouse: true,
        toWarehouse: true,
        items: {
          include: {
            productVariant: true,
          },
        },
      });
    } catch (error) {
      this._handleError(error, "createTransfer", { data });
      throw error;
    }
  }

  // Update transfer status (PENDING -> IN_TRANSIT -> COMPLETED / CANCELLED)
  async updateTransferStatus(id: string, status: "PENDING" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED", notes?: string) {
    try {
      const transfer = await this.repository.findByIdWithRelations(id);
      if (!transfer) {
        throw new AppError("Stock transfer not found", 404, true, undefined, "TRANSFER_NOT_FOUND");
      }

      if (transfer.status === "COMPLETED" || transfer.status === "CANCELLED") {
        throw new AppError("Cannot modify a transfer that is already completed or cancelled", 400, true, undefined, "TRANSFER_LOCKED");
      }

      const updatePayload: any = { status };
      if (notes !== undefined) updatePayload.notes = notes;

      const updatedTransfer = await this.repository.update(id, updatePayload, {
        fromWarehouse: true,
        toWarehouse: true,
        items: {
          include: {
            productVariant: true,
          },
        },
      });

      return updatedTransfer;
    } catch (error) {
      this._handleError(error, "updateTransferStatus", { id, status, notes });
      throw error;
    }
  }

  // Hard delete transfer record
  async hardDeleteTransfer(id: string) {
    try {
      const transfer = await this.repository.findByIdWithRelations(id);
      if (!transfer) {
        throw new AppError("Stock transfer not found", 404, true, undefined, "TRANSFER_NOT_FOUND");
      }
      if (transfer.status === "COMPLETED" && transfer.status === "IN_TRANSIT") {
        throw new AppError("Cannot delete active or completed transfer records", 400, true, undefined, "TRANSFER_ACTIVE_CANNOT_DELETE");
      }
      return await this.repository.hardDelete(id);
    } catch (error) {
      this._handleError(error, "hardDeleteTransfer", { id });
      throw error;
    }
  }

  // Bulk permanent deletion
  async handleBulkOperation(payload: { ids: string[]; action: "hard-delete" }) {
    try {
      const { ids, action } = payload;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new AppError("Invalid or empty IDs array provided", 400, true, undefined, "INVALID_IDS");
      }

      if (action === "hard-delete") {
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