import { BaseRepository } from "../../../core/base/base.repository";

export class StockLevelRepository extends BaseRepository<"stockLevel"> {
  constructor() {
    super("stockLevel");
  }

  // Find stock level by ID with relations (warehouse & productVariant)
  async findByIdWithRelations(id: string) {
    return await (this.model as any).findUnique({
      where: { id },
      include: {
        warehouse: true,
        productVariant: true,
      },
    });
  }

  // Find a stock level by warehouse ID and product variant ID
  async findByWarehouseAndVariant(warehouseId: string, productVariantId: string) {
    return await (this.model as any).findUnique({
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
    const whereCondition: any = {};

    if (warehouseId) {
      whereCondition.warehouseId = warehouseId;
    }

    return await (this.model as any).findMany({
      where: Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
      include: {
        warehouse: true,
        productVariant: true,
      },
    });
  }
}