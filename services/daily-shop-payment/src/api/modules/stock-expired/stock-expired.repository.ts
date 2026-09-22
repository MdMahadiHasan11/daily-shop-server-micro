import { BaseRepository } from "../../../core/base/base.repository";

export class StockExpiredRepository extends BaseRepository<"expiredStockBatch"> {
  constructor() {
    super("expiredStockBatch");
  }

  async findPendingExpiredBatches(today: Date) {
    return await this.prisma.stockBatch.findMany({
      where: {
        expiryDate: { lte: today },
        isDeleted: false,
        currentQuantity: { gt: 0 },
      },
    });
  }

  async archiveAndProcessBatches(expiredBatches: any[]) {
    return await this.prisma.$transaction(async (tx: any) => {
      for (const batch of expiredBatches) {
        await tx.expiredStockBatch.create({
          data: {
            originalBatchId: batch.id,
            productVariantId: batch.productVariantId,
            warehouseId: batch.warehouseId,
            batchNumber: batch.batchNumber,
            expiredQuantity: batch.currentQuantity,
            purchasePrice: batch.purchasePrice,
            mfgDate: batch.mfgDate,
            expiryDate: batch.expiryDate,
            reason: "Automatic expired by midnight cron job",
          },
        });

        await tx.stockBatch.update({
          where: { id: batch.id },
          data: {
            currentQuantity: 0,
            reservedQuantity: 0,
            status: batch.currentQuantity === 0 ? "EXHAUSTED" : "EXPIRED",
          },
        });

        const stockLevel = await tx.stockLevel.findFirst({
          where: {
            productVariantId: batch.productVariantId,
            warehouseId: batch.warehouseId,
          },
        });

        if (stockLevel) {
          const newQuantity = Math.max(
            0,
            stockLevel.quantity - batch.currentQuantity,
          );
          await tx.stockLevel.update({
            where: { id: stockLevel.id },
            data: { quantity: newQuantity },
          });
        }

        await tx.stockTransaction.create({
          data: {
            warehouseId: batch.warehouseId,
            productVariantId: batch.productVariantId,
            type: "STOCK_EXPIRED",
            quantity: batch.currentQuantity,
            referenceId: batch.id,
            note: `Stock removed due to expiration. Batch No: ${batch.batchNumber}`,
            createdBy: "SYSTEM_CRON",
          },
        });
      }
    });
  }
}
