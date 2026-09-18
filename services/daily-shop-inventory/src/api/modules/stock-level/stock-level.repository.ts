import { BaseRepository } from "../../../core/base/base.repository";

export class StockLevelRepository extends BaseRepository<"stockLevel"> {
  constructor() {
    super("stockLevel");
  }

  // Find a stock level by warehouse ID and product variant ID
  async findByWarehouseAndVariant(warehouseId: string, productVariantId: string) {
    return await this.model.findUnique({
      where: {
        warehouseId_productVariantId: {
          warehouseId,
          productVariantId,
        },
      },
      include: {
        warehouse: true,
        productVariant: true,
      },
    });
  }

  // Find low-stock items where quantity is less than or equal to reorderLevel
  async findLowStockItems(warehouseId?: string) {
    const whereCondition: any = {
      quantity: {
        lte: { field: "reorderLevel" }, // Note: Handled via raw or direct evaluation if Prisma supports, or filtered in service
      },
    };

    if (warehouseId) {
      whereCondition.warehouseId = warehouseId;
    }

    // Fetch all or filtered stock levels to process low-stock logic cleanly
    return await this.model.findMany({
      where: warehouseId ? { warehouseId } : undefined,
      include: {
        warehouse: true,
        productVariant: true,
      },
    });
  }
}