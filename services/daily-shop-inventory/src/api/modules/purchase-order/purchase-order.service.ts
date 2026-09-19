import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { StockBatchRepository } from "../stock-batch/stock-batch.repository";
import { StockLevelRepository } from "../stock-level/stock-level.repository";
import { StockTransactionRepository } from "../stock-transaction/stock-transaction.repository";
import { PurchaseOrderRepository } from "./purchase-order.repository";

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
        throw new AppError(
          "Purchase Order not found",
          404,
          true,
          undefined,
          "PO_NOT_FOUND",
        );
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
      const existingPo = await this.repository.findByPoNumber(data.poNumber);
      if (existingPo) {
        throw new AppError(
          "A purchase order with this PO number already exists",
          400,
          true,
          undefined,
          "DUPLICATE_PO_NUMBER",
        );
      }

      const { items, ...poData } = data;

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
        totalAmount:
          poData.totalAmount !== undefined
            ? poData.totalAmount
            : calculatedTotal,
        expectedDate: poData.expectedDate
          ? new Date(poData.expectedDate)
          : null,
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
        throw new AppError(
          "Purchase Order not found",
          404,
          true,
          undefined,
          "PO_NOT_FOUND",
        );
      }

      if (po.status === "RECEIVED" || po.status === "CANCELLED") {
        throw new AppError(
          "Cannot modify a purchase order that is already received or cancelled",
          400,
          true,
          undefined,
          "PO_LOCKED",
        );
      }

      const { status, expectedDate, notes, isDeleted } = data;
      const updatePayload: any = {};

      if (status !== undefined) updatePayload.status = status;
      if (expectedDate !== undefined)
        updatePayload.expectedDate = expectedDate
          ? new Date(expectedDate)
          : null;
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
  async receivePurchaseOrder(
    id: string,
    receivedData: {
      receivedDate?: string;
      notes?: string;
      items?: Array<{ purchaseOrderItemId: string; receivedQuantity: number }>;
    },
  ) {
    try {
      const po = await this.repository.findByIdWithRelations(id);
      if (!po) {
        throw new AppError(
          "Purchase Order not found",
          404,
          true,
          undefined,
          "PO_NOT_FOUND",
        );
      }
      if (po.status === "RECEIVED") {
        throw new AppError(
          "Purchase order has already been fully received",
          400,
          true,
          undefined,
          "PO_ALREADY_RECEIVED",
        );
      }
      if (po.status === "CANCELLED") {
        throw new AppError(
          "Cannot receive a cancelled purchase order",
          400,
          true,
          undefined,
          "PO_CANCELLED",
        );
      }

      for (const item of po.items) {
        const warehouseId = po.warehouseId;
        const productVariantId = item.productVariantId;

        const incomingItem = receivedData.items?.find(
          (i) => i.purchaseOrderItemId === item.id,
        );
        const quantityReceived = incomingItem
          ? incomingItem.receivedQuantity
          : item.orderedQuantity;

        await this.db.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQuantity: quantityReceived },
        });

        let stockLevel =
          await this.stockLevelRepository.findByWarehouseAndVariant(
            warehouseId,
            productVariantId,
          );

        if (stockLevel) {
          const newQuantity = stockLevel.quantity + quantityReceived;
          await this.stockLevelRepository.update(stockLevel.id, {
            quantity: newQuantity,
          });
        } else {
          await this.stockLevelRepository.create({
            warehouseId,
            productVariantId,
            quantity: quantityReceived,
            reorderLevel: 10,
            reorderQuantity: 50,
          });
        }

        const batchNumber = `BATCH-${po.poNumber}-${Math.floor(1000 + Math.random() * 9000)}`;
        await this.stockBatchRepository.create({
          batchNumber,
          warehouseId,
          productVariantId,
          initialQuantity: quantityReceived,
          currentQuantity: quantityReceived,
          purchasePrice: item.unitCost,
          mfgDate: new Date(),
          expiryDate: new Date(
            new Date().setFullYear(new Date().getFullYear() + 2),
          ),
        });

        await this.stockTransactionRepository.create({
          warehouseId,
          productVariantId,
          type: "STOCK_IN",
          quantity: quantityReceived,
          referenceId: po.id,
          note: `Received against PO: ${po.poNumber}`,
        });
      }

      const updatedPo = await this.repository.update(
        id,
        {
          status: "RECEIVED",
          receivedDate: receivedData.receivedDate
            ? new Date(receivedData.receivedDate)
            : new Date(),
          notes: receivedData.notes || po.notes,
        },
        {
          include: {
            supplier: true,
            warehouse: true,
            items: {
              include: {
                productVariant: true,
              },
            },
          },
        },
      );

      return updatedPo;
    } catch (error) {
      this._handleError(error, "receivePurchaseOrder", { id, receivedData });
      throw error;
    }
  }

  // Adjust already RECEIVED purchase order quantities and sync stock levels & batches professionally
  async updateReceivedPurchaseOrder(
    id: string,
    data: {
      notes?: string;
      items?: Array<{ purchaseOrderItemId: string; receivedQuantity: number }>;
    },
  ) {
    try {
      const po = await this.repository.findByIdWithRelations(id);
      if (!po) {
        throw new AppError(
          "Purchase Order not found",
          404,
          true,
          undefined,
          "PO_NOT_FOUND",
        );
      }

      if (po.status !== "RECEIVED") {
        throw new AppError(
          "Only received purchase orders can be adjusted",
          400,
          true,
          undefined,
          "INVALID_PO_STATUS",
        );
      }

      for (const item of po.items) {
        const warehouseId = po.warehouseId;
        const productVariantId = item.productVariantId;
        const oldReceivedQty = item.receivedQuantity;

        const incomingItem = data.items?.find(
          (i) => i.purchaseOrderItemId === item.id,
        );

        if (!incomingItem) continue;

        const newReceivedQty = incomingItem.receivedQuantity;
        const quantityDifference = newReceivedQty - oldReceivedQty; // যেমন: 95 - 100 = -5

        if (quantityDifference === 0) continue;

        // 1. Update purchase order item quantity
        await this.db.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQuantity: newReceivedQty },
        });

        // 2. Adjust StockLevel based on difference (-5)
        let stockLevel =
          await this.stockLevelRepository.findByWarehouseAndVariant(
            warehouseId,
            productVariantId,
          );

        if (stockLevel) {
          const updatedQuantity = stockLevel.quantity + quantityDifference;
          if (updatedQuantity < 0) {
            throw new AppError(
              `Stock level cannot be negative after adjustment for variant ${productVariantId}`,
              400,
              true,
              undefined,
              "INVALID_STOCK_QUANTITY",
            );
          }
          await this.stockLevelRepository.update(stockLevel.id, {
            quantity: updatedQuantity,
          });
        }

        // 3. FIX: Adjust the corresponding StockBatch quantity as well
        const stockBatch = await this.db.stockBatch.findFirst({
          where: {
            warehouseId,
            productVariantId,
          },
          orderBy: { createdAt: "desc" },
        });

        if (stockBatch) {
          const updatedBatchQty =
            stockBatch.currentQuantity + quantityDifference;
          if (updatedBatchQty < 0) {
            throw new AppError(
              `Batch quantity cannot be negative after adjustment`,
              400,
              true,
              undefined,
              "INVALID_BATCH_QUANTITY",
            );
          }
          await this.db.stockBatch.update({
            where: { id: stockBatch.id },
            data: { currentQuantity: updatedBatchQty },
          });
        }

        // 4. Log stock transaction as STOCK_IN or STOCK_OUT with absolute difference value
        await this.stockTransactionRepository.create({
          warehouseId,
          productVariantId,
          type: quantityDifference > 0 ? "STOCK_IN" : "STOCK_OUT",
          quantity: Math.abs(quantityDifference),
          referenceId: po.id,
          note: `PO Adjustment (${po.poNumber}): Updated received quantity from ${oldReceivedQty} to ${newReceivedQty}. Note: ${data.notes || "Damage/Correction"}`,
        });
      }

      // 5. Update PO notes and return updated record
      const updatedPo = await this.repository.update(
        id,
        {
          notes: data.notes !== undefined ? data.notes : po.notes,
        },
        {
          include: {
            supplier: true,
            warehouse: true,
            items: {
              include: {
                productVariant: true,
              },
            },
          },
        },
      );

      return updatedPo;
    } catch (error) {
      this._handleError(error, "updateReceivedPurchaseOrder", { id, data });
      throw error;
    }
  }

  // Soft delete purchase order
  async softDeletePurchaseOrder(id: string) {
    try {
      const po = await this.repository.findByIdWithRelations(id);
      if (!po) {
        throw new AppError(
          "Purchase Order not found",
          404,
          true,
          undefined,
          "PO_NOT_FOUND",
        );
      }
      if (po.isDeleted) {
        throw new AppError(
          "Purchase Order is already deleted",
          400,
          true,
          undefined,
          "PO_ALREADY_DELETED",
        );
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
        throw new AppError(
          "Purchase Order not found",
          404,
          true,
          undefined,
          "PO_NOT_FOUND",
        );
      }
      if (!po.isDeleted) {
        throw new AppError(
          "Purchase Order is not deleted yet",
          400,
          true,
          undefined,
          "PO_NOT_DELETED",
        );
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
        throw new AppError(
          "Purchase Order not found",
          404,
          true,
          undefined,
          "PO_NOT_FOUND",
        );
      }
      if (!po.isDeleted) {
        throw new AppError(
          "Purchase Order must be soft deleted before permanent deletion",
          400,
          true,
          undefined,
          "PO_NOT_SOFT_DELETED",
        );
      }
      return await this.repository.hardDelete(id);
    } catch (error) {
      this._handleError(error, "hardDeletePurchaseOrder", { id });
      throw error;
    }
  }

  // Bulk operations (soft-delete, restore, hard-delete)
  async handleBulkOperation(payload: {
    ids: string[];
    action: "soft-delete" | "restore" | "hard-delete";
  }) {
    try {
      const { ids, action } = payload;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new AppError(
          "Invalid or empty IDs array provided",
          400,
          true,
          undefined,
          "INVALID_IDS",
        );
      }

      if (action === "soft-delete") {
        return await this.repository.updateManyStatus(ids, true);
      } else if (action === "restore") {
        return await this.repository.updateManyStatus(ids, false);
      } else if (action === "hard-delete") {
        return await this.repository.hardDeleteMany(ids);
      } else {
        throw new AppError(
          "Invalid bulk action specified",
          400,
          true,
          undefined,
          "INVALID_ACTION",
        );
      }
    } catch (error) {
      this._handleError(error, "handleBulkOperation", { payload });
      throw error;
    }
  }
}
