import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { logger } from "../../../core/utils/logger.utils";
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
        include: {
          warehouse: true,
          productVariant: true,
        },
      });
    } catch (error) {
      this._handleError(error, "getAllStockLevels", { query });
      throw error;
    }
  }

  // Get specific stock level by ID
  async getStockLevelById(id: string) {
    try {
      const stockLevel = await this.repository.findByIdWithRelations(id);

      if (!stockLevel) {
        throw new AppError(
          "Stock level record not found",
          404,
          true,
          undefined,
          "STOCK_LEVEL_NOT_FOUND",
        );
      }
      return stockLevel;
    } catch (error) {
      this._handleError(error, "getStockLevelById", { id });
      throw error;
    }
  }

  // Get stock level by Warehouse and Product Variant
  async getStockByWarehouseAndVariant(
    warehouseId: string,
    productVariantId: string,
  ) {
    try {
      const stock = await this.repository.findByWarehouseAndVariant(
        warehouseId,
        productVariantId,
      );
      if (!stock) {
        throw new AppError(
          "Stock record not found for this warehouse and product variant",
          404,
          true,
          undefined,
          "STOCK_NOT_FOUND",
        );
      }
      return stock;
    } catch (error) {
      this._handleError(error, "getStockByWarehouseAndVariant", {
        warehouseId,
        productVariantId,
      });
      throw error;
    }
  }

  // Update reorder settings (reorderLevel, reorderQuantity)
  async updateStockThresholds(
    id: string,
    data: { reorderLevel?: number; reorderQuantity?: number },
  ) {
    try {
      const stockLevel = await this.repository.findById(id);
      if (!stockLevel) {
        throw new AppError(
          "Stock level record not found",
          404,
          true,
          undefined,
          "STOCK_LEVEL_NOT_FOUND",
        );
      }

      const updatePayload: any = {};
      if (data.reorderLevel !== undefined)
        updatePayload.reorderLevel = data.reorderLevel;
      if (data.reorderQuantity !== undefined)
        updatePayload.reorderQuantity = data.reorderQuantity;

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
      const lowStockItems = allStocks.filter(
        (item: any) => item.quantity <= item.reorderLevel,
      );
      return lowStockItems;
    } catch (error) {
      this._handleError(error, "getLowStockAlerts", { warehouseId });
      throw error;
    }
  }

  // Get total, available and detailed stock summary by product variant id
  async getStockSummaryByVariant(
    productVariantId: string,
    query?: { fields?: string },
  ) {
    try {
      const stockRecords =
        await this.repository.getStockByProductVariantId(productVariantId);

      if (!stockRecords || stockRecords.length === 0) {
        throw new AppError(
          "Stock record not found for this product variant",
          404,
          true,
          undefined,
          "STOCK_NOT_FOUND",
        );
      }

      let totalQuantity = 0;
      let totalAvailable = 0;
      let totalReserved = 0;
      let maxSingleWarehouseStock = 0; // Track the maximum available stock in any single warehouse

      const warehouseDetails = stockRecords.map((item: any) => {
        const quantity = item.quantity || 0;
        const reserved = item.reservedQuantity || 0;
        const available = quantity - reserved;

        totalQuantity += quantity;
        totalReserved += reserved;
        totalAvailable += available;

        // Find the maximum available stock in a single warehouse
        if (available > maxSingleWarehouseStock) {
          maxSingleWarehouseStock = available;
        }

        return {
          warehouseId: item.warehouseId,
          warehouseName: item.warehouse?.name || "Unknown",
          quantity,
          reservedQuantity: reserved,
          availableStock: available,
          reorderLevel: item.reorderLevel,
          reorderQuantity: item.reorderQuantity,
        };
      });

      if (query?.fields === "minimal") {
        return {
          productVariantId,
          totalQuantity,
          availableStock: totalAvailable,
          maxSingleWarehouseStock,
          totalReserved,
        };
      }

      return {
        productVariantId,
        summary: {
          totalQuantity,
          totalReserved,
          availableStock: totalAvailable,
          maxSingleWarehouseStock, // Maximum quantity that can be ordered from a single warehouse at once
          isAvailable: totalAvailable > 0,
        },
        warehouses: warehouseDetails,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this._handleError(error, "getStockSummaryByVariant", {
        productVariantId,
      });
      throw error;
    }
  }

  async holdStockForOrder(data: {
    orderId: string;
    orderNumber: string;
    allocationPlan: Array<{
      branchId: string;
      variantId: string;
      allocatedQty: number;
    }>;
  }) {
    const { orderId, orderNumber, allocationPlan } = data;

    try {
      const result = await this.db.$transaction(async (tx: any) => {
        const updatedStockLevels = [];

        for (const item of allocationPlan) {
          const { variantId, branchId, allocatedQty } = item;
          const warehouseId = branchId;

          const stockLevelRecord = await tx.stockLevel.findFirst({
            where: {
              productVariantId: variantId,
              warehouseId: warehouseId,
              isDeleted: false,
            },
          });

          if (!stockLevelRecord) {
            throw new AppError(
              `Stock level record not found for variant ${variantId} in warehouse ${warehouseId}`,
              404,
              true,
              undefined,
              "STOCK_RECORD_NOT_FOUND",
            );
          }

          // (Total Quantity - Reserved Quantity)
          const availableStock =
            stockLevelRecord.quantity - stockLevelRecord.reservedQuantity;

          if (availableStock < allocatedQty) {
            throw new AppError(
              `Insufficient available stock for variant ${variantId} in warehouse ${warehouseId}. Required: ${allocatedQty}, Available: ${availableStock}`,
              400,
              true,
              undefined,
              "INSUFFICIENT_STOCK",
            );
          }

          // FEFO
          const batches = await tx.stockBatch.findMany({
            where: {
              productVariantId: variantId,
              warehouseId: warehouseId,
              status: "ACTIVE",
              isDeleted: false,
            },
            orderBy: {
              expiryDate: "asc",
            },
          });

          let remainingToDeduct = allocatedQty;

          for (const batch of batches) {
            if (remainingToDeduct <= 0) break;

            const batchAvailable =
              batch.currentQuantity - (batch.reservedQuantity || 0);

            if (batchAvailable <= 0) continue;

            const reserveFromBatch = Math.min(
              batchAvailable,
              remainingToDeduct,
            );

            await tx.stockBatch.update({
              where: { id: batch.id },
              data: {
                reservedQuantity: {
                  increment: reserveFromBatch,
                },
              },
            });

            remainingToDeduct -= reserveFromBatch;
          }

          if (remainingToDeduct > 0) {
            throw new AppError(
              `Insufficient batch stock for variant ${variantId} in warehouse ${warehouseId}. Missing: ${remainingToDeduct}`,
              400,
              true,
              undefined,
              "INSUFFICIENT_BATCH_STOCK",
            );
          }

          const updatedStockLevel = await tx.stockLevel.update({
            where: { id: stockLevelRecord.id },
            data: {
              reservedQuantity: {
                increment: allocatedQty,
              },
            },
          });

          await tx.stockTransaction.create({
            data: {
              warehouseId: warehouseId,
              productVariantId: variantId,
              type: "STOCK_OUT",
              referenceId: orderId,
              note: `Stock reserved for order: ${orderNumber}`,
              quantity: allocatedQty,
            },
          });

          updatedStockLevels.push(updatedStockLevel);
        }
        return updatedStockLevels;
      });

      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this._handleError(error, "holdStockForOrder", data);
      throw error;
    }
  }

  async releaseStockForOrder(data: {
    orderId: string;
    orderNumber?: string;
    allocationPlan: Array<{
      branchId: string;
      variantId: string;
      allocatedQty: number;
    }>;
  }) {
    const { orderId, allocationPlan } = data;

    try {
      // Step 1: Check if the order exists in the database
      const order = await this.repository.OrderCheck(orderId);

      // Step 2: If the order exists, check if it's already paid or confirmed.
      // If it doesn't exist yet (failed during checkout creation), we skip this check and proceed to release stock.
      if (order) {
        if (order.paymentStatus === "PAID" || order.status === "CONFIRMED") {
          logger.info(
            { orderId },
            "Order is already paid or approved. Skipping stock release inside releaseStockForOrder. 👍",
          );
          return;
        }
      } else {
        logger.info(
          { orderId },
          "Order record not found in DB (likely failed during checkout transaction). Proceeding with stock release. 🔄",
        );
      }

      // Step 3: Perform database transaction to decrement reserved quantities and update batches
      await this.db.$transaction(async (tx: any) => {
        for (const item of allocationPlan) {
          const { branchId, variantId, allocatedQty } = item;
          const warehouseId = branchId; // branchId is treated as warehouseId

          const stockLevelRecord = await tx.stockLevel.findFirst({
            where: {
              productVariantId: variantId,
              warehouseId: warehouseId,
              isDeleted: false,
            },
          });

          if (!stockLevelRecord) continue;

          if (stockLevelRecord.reservedQuantity <= 0) continue;

          const batches = await tx.stockBatch.findMany({
            where: {
              productVariantId: variantId,
              warehouseId: warehouseId,
              isDeleted: false,
            },
            orderBy: {
              expiryDate: "asc",
            },
          });

          let remainingToRelease = allocatedQty;

          for (const batch of batches) {
            if (remainingToRelease <= 0) break;
            if (!batch.reservedQuantity || batch.reservedQuantity <= 0)
              continue;

            const releaseFromBatch = Math.min(
              batch.reservedQuantity,
              remainingToRelease,
            );

            await tx.stockBatch.update({
              where: { id: batch.id },
              data: {
                reservedQuantity: {
                  decrement: releaseFromBatch,
                },
              },
            });

            remainingToRelease -= releaseFromBatch;
          }

          const newReservedQty = Math.max(
            0,
            stockLevelRecord.reservedQuantity - allocatedQty,
          );

          await tx.stockLevel.update({
            where: { id: stockLevelRecord.id },
            data: {
              reservedQuantity: newReservedQty,
            },
          });

          await tx.stockTransaction.create({
            data: {
              warehouseId: warehouseId,
              productVariantId: variantId,
              type: "ADJUSTMENT",
              quantity: allocatedQty,
              referenceId: orderId,
              note: `Stock released for order cancellation/expiry/creation failure: ${orderId}`,
            },
          });
        }
      });

      // Step 4: Update order status only if the order actually exists in the database
      if (order) {
        await this.repository.OrderStatusUpdate(orderId);
      }

      return;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this._handleError(error, "releaseStockForOrder", data);
      throw error;
    }
  }

  async deductStockPermanently(data: {
    orderId: string;
    orderNumber?: string;
    allocationPlan: Array<{
      branchId: string;
      variantId: string;
      allocatedQty: number;
    }>;
  }) {
    const { orderId, orderNumber, allocationPlan } = data;

    try {
      await this.db.$transaction(async (tx: any) => {
        for (const item of allocationPlan) {
          const { branchId, variantId, allocatedQty } = item;
          const warehouseId = branchId; // branchId is treated as warehouseId

          const stockLevelRecord = await tx.stockLevel.findFirst({
            where: {
              productVariantId: variantId,
              warehouseId: warehouseId,
              isDeleted: false,
            },
          });

          if (!stockLevelRecord) {
            throw new AppError(
              `Stock level record not found for variant ${variantId} in warehouse ${warehouseId}`,
              404,
              true,
              undefined,
              "STOCK_RECORD_NOT_FOUND",
            );
          }

          if (stockLevelRecord.reservedQuantity < allocatedQty) {
            throw new AppError(
              `Reserved stock is less than allocated quantity for variant ${variantId} in warehouse ${warehouseId}`,
              400,
              true,
              undefined,
              "INSUFFICIENT_RESERVED_STOCK",
            );
          }

          // Fetch active batches sorted by FEFO (expiryDate ascending)
          const batches = await tx.stockBatch.findMany({
            where: {
              productVariantId: variantId,
              warehouseId: warehouseId,
              isDeleted: false,
            },
            orderBy: {
              expiryDate: "asc",
            },
          });

          let remainingToDeduct = allocatedQty;

          for (const batch of batches) {
            if (remainingToDeduct <= 0) break;
            if (!batch.reservedQuantity || batch.reservedQuantity <= 0)
              continue;

            const deductFromBatch = Math.min(
              batch.reservedQuantity,
              remainingToDeduct,
            );

            // Permanently decrement both reservedQuantity and currentQuantity from the batch
            await tx.stockBatch.update({
              where: { id: batch.id },
              data: {
                reservedQuantity: {
                  decrement: deductFromBatch,
                },
                currentQuantity: {
                  decrement: deductFromBatch,
                },
              },
            });

            remainingToDeduct -= deductFromBatch;
          }

          // Update stock level: decrease both reservedQuantity and main quantity permanently
          const newReservedQty = Math.max(
            0,
            stockLevelRecord.reservedQuantity - allocatedQty,
          );
          const newTotalQty = Math.max(
            0,
            stockLevelRecord.quantity - allocatedQty,
          );

          await tx.stockLevel.update({
            where: { id: stockLevelRecord.id },
            data: {
              reservedQuantity: newReservedQty,
              quantity: newTotalQty,
            },
          });

          // Optional: Record the permanent stock out transaction if needed
          await tx.stockTransaction.create({
            data: {
              warehouseId: warehouseId,
              productVariantId: variantId,
              type: "STOCK_OUT",
              referenceId: orderId,
              note: `Stock permanently deducted for order: ${orderNumber || orderId}`,
              quantity: allocatedQty,
            },
          });
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this._handleError(error, "deductStockPermanently", data);
      throw error;
    }
  }

  async getStockExpired(query: any) {
    try {
      return await this.repository.getList(query, {
        include: {
          warehouse: true,
          productVariant: true,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      this._handleError(error, "getStockExpired", { query });
      throw error;
    }
  }
}
