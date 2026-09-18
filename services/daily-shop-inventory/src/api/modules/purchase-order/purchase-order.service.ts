import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { PurchaseOrderRepository } from "./purchase-order.repository";
import { StockLevelRepository } from "../stock-level/stock-level.repository";
import { StockBatchRepository } from "../stock-batch/stock-batch.repository";
import { StockTransactionRepository } from "../stock-transaction/stock-transaction.repository";

export class PurchaseOrderService extends BaseService {
  private readonly repository: PurchaseOrderRepository;
  private readonly stockLevelRepository: StockLevelRepository;
  private readonly stockBatchRepository: StockBatchRepository;
  private readonly stockTransactionRepository: StockTransactionRepository;

  constructor() {
    super();
    this.repository = new PurchaseOrderRepository();
    this.stockLevelRepository = new StockLevelRepository();
    this.stockBatchRepository = new StockBatchRepository();
    this.stockTransactionRepository = new StockTransactionRepository();
    this.serviceName = "PurchaseOrderService";
  }

  // Get all purchase orders with pagination and filtering
  async getAllPurchaseOrders(query: any) {
    try {
      return await this.repository.getList(query, {
        include: {
          supplier: true,
          warehouse: true,
          items: {
            include: {
              productVariant: true,
            },
          },
        },
      });
    } catch (error) {
      this._handleError(error, "getAllPurchaseOrders", { query });
      throw error;
    }
  }

  // Get single purchase order by ID
  async getPurchaseOrderById(id: string) {
    try {
      const po = await this.repository.findByIdWithRelations(id);
      if (!po) {
        throw new AppError("Purchase Order not found", 404, true, undefined, "PO_NOT_FOUND");
      }
      return po;
    } catch (error) {
      this._handleError(error, "getPurchaseOrderById", { id });
      throw error;
    }
  }

  // Create a new purchase order with line items
  async createPurchaseOrder(data: any) {
    try {
      // Check if PO Number is unique
      const existingPo = await this.repository.findByPoNumber(data.poNumber);
      if (existingPo) {
        throw new AppError("A purchase order with this PO number already exists", 400, true, undefined, "DUPLICATE_PO_NUMBER");
      }

      const { items, ...poData } = data;

      // Calculate total amount from items if items exist
      let calculatedTotal = 0;
      const formattedItems = items.map((item: any) => {
        const totalCost = item.orderedQuantity * item.unitCost;
        calculatedTotal += totalCost;
        return {
          productVariantId: item.productVariantId,
          orderedQuantity: item.orderedQuantity,
          receivedQuantity: 0,
          unitCost: item.unitCost,
          totalCost: totalCost,
        };
      });

      const payload = {
        ...poData,
        totalAmount: poData.totalAmount !== undefined ? poData.totalAmount : calculatedTotal,
        expectedDate: poData.expectedDate ? new Date(poData.expectedDate) : null,
        items: {
          create: formattedItems,
        },
      };

      return await this.repository.create(payload, {
        include: {
          supplier: true,
          warehouse: true,
          items: {
            include: {
              productVariant: true,
            },
          },
        },
      });
    } catch (error) {
      this._handleError(error, "createPurchaseOrder", { data });
      throw error;
    }
  }

  // Update purchase order status or details
  async updatePurchaseOrder(id: string, data: any) {
    try {
      const po = await this.repository.findByIdWithRelations(id);
      if (!po) {
        throw new AppError("Purchase Order not found", 404, true, undefined, "PO_NOT_FOUND");
      }

      if (po.status === "RECEIVED" || po.status === "CANCELLED") {
        throw new AppError("Cannot modify a purchase order that is already received or cancelled", 400, true, undefined, "PO_LOCKED");
      }

      const { status, expectedDate, notes, isDeleted } = data;
      const updatePayload: any = {};

      if (status !== undefined) updatePayload.status = status;
      if (expectedDate !== undefined) updatePayload.expectedDate = expectedDate ? new Date(expectedDate) : null;
      if (notes !== undefined) updatePayload.notes = notes;
      if (isDeleted !== undefined) updatePayload.isDeleted = isDeleted;

      return await this.repository.update(id, updatePayload, {
        include: {
          supplier: true,
          warehouse: true,
          items: {
            include: {
              productVariant: true,
            },
          },
        },
      });
    } catch (error) {
      this._handleError(error, "updatePurchaseOrder", { id, data });
      throw error;
    }
  }

  // Receive goods against a purchase order and update StockLevel, StockBatch & StockTransaction
  async receivePurchaseOrder(id: string, receivedData: { receivedDate?: string; notes?: string }) {
    try {
      const po = await this.repository.findByIdWithRelations(id);
      if (!po) {
        throw new AppError("Purchase Order not found", 404, true, undefined, "PO_NOT_FOUND");
      }
      if (po.status === "RECEIVED") {
        throw new AppError("Purchase order has already been fully received", 400, true, undefined, "PO_ALREADY_RECEIVED");
      }
      if (po.status === "CANCELLED") {
        throw new AppError("Cannot receive a cancelled purchase order", 400, true, undefined, "PO_CANCELLED");
      }

      // Loop through each item in the purchase order
      for (const item of po.items) {
        const warehouseId = po.warehouseId;
        const productVariantId = item.productVariantId;
        const quantityReceived = item.orderedQuantity;

        // 1. Check & Update StockLevel
        let stockLevel = await this.stockLevelRepository.findByWarehouseAndVariant(warehouseId, productVariantId);

        if (stockLevel) {
          const newQuantity = stockLevel.quantity + quantityReceived;
          await this.stockLevelRepository.update(stockLevel.id, { quantity: newQuantity });
        } else {
          await this.stockLevelRepository.create({
            warehouseId,
            productVariantId,
            quantity: quantityReceived,
            reorderLevel: 10,
            reorderQuantity: 50,
          });
        }

        // 2. Create Stock Batch (Lot entry)
        const batchNumber = `BATCH-${po.poNumber}-${Math.floor(1000 + Math.random() * 9000)}`;
        await this.stockBatchRepository.create({
          batchNumber,
          warehouseId,
          productVariantId,
          initialQuantity: quantityReceived,
          currentQuantity: quantityReceived,
          purchasePrice: item.unitCost,
          mfgDate: new Date(),
          expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
        });

        // 3. Create Stock Transaction Record (Matches schema: 'note' instead of 'notes')
        await this.stockTransactionRepository.create({
          warehouseId,
          productVariantId,
          type: "STOCK_IN",
          quantity: quantityReceived,
          referenceId: po.id,
          note: `Received against PO: ${po.poNumber}`,
        });
      }

      // Update PO status to RECEIVED
      const updatedPo = await this.repository.update(id, {
        status: "RECEIVED",
        receivedDate: receivedData.receivedDate ? new Date(receivedData.receivedDate) : new Date(),
        notes: receivedData.notes || po.notes,
      }, {
        include: {
          supplier: true,
          warehouse: true,
          items: {
            include: {
              productVariant: true,
            },
          },
        },
      });

      return updatedPo;
    } catch (error) {
      this._handleError(error, "receivePurchaseOrder", { id, receivedData });
      throw error;
    }
  }

  // Soft delete purchase order
  async softDeletePurchaseOrder(id: string) {
    try {
      const po = await this.repository.findByIdWithRelations(id);
      if (!po) {
        throw new AppError("Purchase Order not found", 404, true, undefined, "PO_NOT_FOUND");
      }
      if (po.isDeleted) {
        throw new AppError("Purchase Order is already deleted", 400, true, undefined, "PO_ALREADY_DELETED");
      }
      return await this.repository.update(id, { isDeleted: true });
    } catch (error) {
      this._handleError(error, "softDeletePurchaseOrder", { id });
      throw error;
    }
  }

  // Restore soft-deleted purchase order
  async restorePurchaseOrder(id: string) {
    try {
      const po = await this.repository.findByIdWithRelations(id);
      if (!po) {
        throw new AppError("Purchase Order not found", 404, true, undefined, "PO_NOT_FOUND");
      }
      if (!po.isDeleted) {
        throw new AppError("Purchase Order is not deleted yet", 400, true, undefined, "PO_NOT_DELETED");
      }
      return await this.repository.update(id, { isDeleted: false });
    } catch (error) {
      this._handleError(error, "restorePurchaseOrder", { id });
      throw error;
    }
  }

  // Hard delete purchase order
  async hardDeletePurchaseOrder(id: string) {
    try {
      const po = await this.repository.findByIdWithRelations(id);
      if (!po) {
        throw new AppError("Purchase Order not found", 404, true, undefined, "PO_NOT_FOUND");
      }
      if (!po.isDeleted) {
        throw new AppError("Purchase Order must be soft deleted before permanent deletion", 400, true, undefined, "PO_NOT_SOFT_DELETED");
      }
      return await this.repository.hardDelete(id);
    } catch (error) {
      this._handleError(error, "hardDeletePurchaseOrder", { id });
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