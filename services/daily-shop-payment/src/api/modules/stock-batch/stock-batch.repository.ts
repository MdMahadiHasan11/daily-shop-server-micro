import { BaseRepository } from "../../../core/base/base.repository";

export class StockBatchRepository extends BaseRepository<"stockBatch"> {
  constructor() {
    super("stockBatch");
  }

  // Find a batch by ID including soft-deleted ones (needed for restore/hard-delete checks)
  async findByIdIncludingDeleted(id: string) {
    return await this.model.findUnique({
      where: { id },
      include: {
        warehouse: true,
        productVariant: true,
      },
    });
  }

  // Find a batch by its unique batch number
  async findByBatchNumber(batchNumber: string) {
    return await this.model.findUnique({
      where: { batchNumber },
      include: {
        warehouse: true,
        productVariant: true,
      },
    });
  }

  // Find batches nearing expiration date
  async findExpiringBatches(expiryThresholdDate: Date, warehouseId?: string) {
    const whereCondition: any = {
      isDeleted: false,
      currentQuantity: { gt: 0 },
      expiryDate: {
        lte: expiryThresholdDate,
        gte: new Date(), // Not yet expired, but approaching
      },
    };

    if (warehouseId) {
      whereCondition.warehouseId = warehouseId;
    }

    return await this.model.findMany({
      where: whereCondition,
      include: {
        warehouse: true,
        productVariant: true,
      },
      orderBy: { expiryDate: "asc" },
    });
  }

  // Bulk update status (soft delete or restore)
  async updateManyStatus(ids: string[], isDeleted: boolean) {
    return await this.model.updateMany({
      where: { id: { in: ids } },
      data: { isDeleted },
    });
  }

  // Bulk permanent deletion
  async hardDeleteMany(ids: string[]) {
    return await this.model.deleteMany({
      where: { id: { in: ids } },
    });
  }
}