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
    items: Array<{
      productVariantId: string;
      quantity: number;
      warehouseId?: string;
    }>;
  }) {
    const { orderId, items } = data;

    try {
      const result = await this.db.$transaction(async (tx: any) => {
        const updatedStockLevels = [];

        for (const item of items) {
          const { productVariantId, quantity, warehouseId } = item;

          let stockLevelQuery: any = {
            productVariantId: productVariantId,
            isDeleted: false,
          };

          if (warehouseId) {
            stockLevelQuery.warehouseId = warehouseId;
          }

          const potentialStockLevels = await tx.stockLevel.findMany({
            where: stockLevelQuery,
          });

          if (!potentialStockLevels || potentialStockLevels.length === 0) {
            throw new AppError(
              `No stock record found for variant ${productVariantId}`,
              400,
              true,
              undefined,
              "INSUFFICIENT_STOCK",
            );
          }

          let targetWarehouseId: string | null = null;
          let targetBatches: any[] = [];

          for (const stockLevel of potentialStockLevels) {
            // Check available stock (Total Quantity - Reserved Quantity)
            const availableStock =
              stockLevel.quantity - stockLevel.reservedQuantity;
            if (availableStock < quantity) continue;

            const batches = await tx.StockBatch.findMany({
              where: {
                productVariantId: productVariantId,
                warehouseId: stockLevel.warehouseId,
                isDeleted: false,
              },
              orderBy: {
                expiryDate: "asc",
              },
            });

            // Calculate total available batch quantity
            const totalAvailableBatchQty = batches.reduce(
              (sum: number, b: any) =>
                sum + (b.currentQuantity - (b.reservedQuantity || 0)),
              0,
            );

            if (totalAvailableBatchQty >= quantity) {
              targetWarehouseId = stockLevel.warehouseId;
              targetBatches = batches;
              break;
            }
          }

          if (!targetWarehouseId || targetBatches.length === 0) {
            throw new AppError(
              `Insufficient available stock (considering reservations) for variant ${productVariantId}. Required: ${quantity}`,
              400,
              true,
              undefined,
              "INSUFFICIENT_BATCH_STOCK",
            );
          }

          let remainingToDeduct = quantity;

          for (const batch of targetBatches) {
            if (remainingToDeduct <= 0) break;

            const batchAvailable =
              batch.currentQuantity - (batch.reservedQuantity || 0);
            if (batchAvailable <= 0) continue;

            const reserveFromBatch = Math.min(
              batchAvailable,
              remainingToDeduct,
            );

            await tx.StockBatch.update({
              where: { id: batch.id },
              data: {
                reservedQuantity: {
                  increment: reserveFromBatch,
                },
              },
            });

            remainingToDeduct -= reserveFromBatch;
          }

          const stockLevelRecord = await tx.stockLevel.findFirst({
            where: {
              productVariantId: productVariantId,
              warehouseId: targetWarehouseId,
            },
          });

          if (!stockLevelRecord) {
            throw new AppError(
              `StockLevel summary record not found for variant ${productVariantId} in warehouse ${targetWarehouseId}`,
              404,
              true,
              undefined,
              "STOCK_RECORD_NOT_FOUND",
            );
          }

          const updatedStockLevel = await tx.stockLevel.update({
            where: { id: stockLevelRecord.id },
            data: {
              reservedQuantity: {
                increment: quantity,
              },
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
    items: Array<{
      productVariantId: string;
      quantity: number;
      warehouseId?: string;
    }>;
  }) {
    const { orderId, items } = data;

    try {
      // 1. Call Order Service (via HTTP or RPC) to check the current status of the order
      // Example: const orderResponse = await this.orderServiceClient.get(`/orders/${orderId}`);
      // const order = orderResponse.data;

      // 2. If the order is already PAID, APPROVED, or CONFIRMED, do NOT release the stock
      /*
      if (order && (order.paymentStatus === 'PAID' || order.status === 'APPROVED' || order.status === 'CONFIRMED')) {
        logger.info(
          { orderId },
          "Order is already paid or approved. Skipping stock release inside releaseStockForOrder. 👍"
        );
        return;
      }
      */

      const order = await this.repository.OrderCheck(orderId);
      console.log(order);
      if (
        order &&
        (order.paymentStatus === "PAID" ||
          order.status === "APPROVED" ||
          order.status === "CONFIRMED")
      ) {
        logger.info(
          { orderId },
          "Order is already paid or approved. Skipping stock release inside releaseStockForOrder. 👍",
        );
        return;
      }

      await this.db.$transaction(async (tx: any) => {
        for (const item of items) {
          const { productVariantId, quantity, warehouseId } = item;

          let stockLevelQuery: any = {
            productVariantId: productVariantId,
            isDeleted: false,
          };

          if (warehouseId) {
            stockLevelQuery.warehouseId = warehouseId;
          }

          const stockLevels = await tx.stockLevel.findMany({
            where: stockLevelQuery,
          });

          if (!stockLevels || stockLevels.length === 0) continue;

          for (const stockLevel of stockLevels) {
            // Skip if there is no reserved stock in this warehouse
            if (stockLevel.reservedQuantity <= 0) continue;

            const batches = await tx.StockBatch.findMany({
              where: {
                productVariantId: productVariantId,
                warehouseId: stockLevel.warehouseId,
                isDeleted: false,
              },
            });

            let remainingToRelease = quantity;

            for (const batch of batches) {
              if (remainingToRelease <= 0) break;
              if (!batch.reservedQuantity || batch.reservedQuantity <= 0)
                continue;

              const releaseFromBatch = Math.min(
                batch.reservedQuantity,
                remainingToRelease,
              );

              // Decrement the reservedQuantity of the batch
              await tx.StockBatch.update({
                where: { id: batch.id },
                data: {
                  reservedQuantity: {
                    decrement: releaseFromBatch,
                  },
                },
              });

              remainingToRelease -= releaseFromBatch;
            }

            // Decrement the reservedQuantity from the StockLevel table
            // Ensure it never results in a negative value
            const newReservedQty = Math.max(
              0,
              stockLevel.reservedQuantity - quantity,
            );

            await tx.stockLevel.update({
              where: { id: stockLevel.id },
              data: {
                reservedQuantity: newReservedQty,
              },
            });
            break;
          }
        }
      });

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
    items: Array<{
      productVariantId: string;
      quantity: number;
      warehouseId?: string;
    }>;
  }) {
    const { orderId, items } = data;

    try {
      await this.db.$transaction(async (tx: any) => {
        for (const item of items) {
          const { productVariantId, quantity, warehouseId } = item;

          let stockLevelQuery: any = {
            productVariantId: productVariantId,
            isDeleted: false,
          };

          if (warehouseId) {
            stockLevelQuery.warehouseId = warehouseId;
          }

          const stockLevels = await tx.stockLevel.findMany({
            where: stockLevelQuery,
          });

          if (!stockLevels || stockLevels.length === 0) {
            throw new AppError(
              `Stock level record not found for variant ${productVariantId}`,
              404,
              true,
              undefined,
              "STOCK_RECORD_NOT_FOUND",
            );
          }

          for (const stockLevel of stockLevels) {
            if (stockLevel.reservedQuantity < quantity) {
              // Note: If reserved quantity is less than required, handle accordingly
              continue;
            }

            const batches = await tx.StockBatch.findMany({
              where: {
                productVariantId: productVariantId,
                warehouseId: stockLevel.warehouseId,
                isDeleted: false,
              },
            });

            let remainingToDeduct = quantity;

            for (const batch of batches) {
              if (remainingToDeduct <= 0) break;
              if (!batch.reservedQuantity || batch.reservedQuantity <= 0)
                continue;

              const deductFromBatch = Math.min(
                batch.reservedQuantity,
                remainingToDeduct,
              );

              // 1. Decrement both reservedQuantity and currentQuantity from StockBatch
              await tx.StockBatch.update({
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

            // 2. Decrement both reservedQuantity and main quantity from StockLevel
            const newReservedQty = Math.max(
              0,
              stockLevel.reservedQuantity - quantity,
            );
            const newTotalQty = Math.max(0, stockLevel.quantity - quantity);

            await tx.stockLevel.update({
              where: { id: stockLevel.id },
              data: {
                reservedQuantity: newReservedQty,
                quantity: newTotalQty,
              },
            });
            break;
          }
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
}
