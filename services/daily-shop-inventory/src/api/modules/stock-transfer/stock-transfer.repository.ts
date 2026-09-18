import { BaseRepository } from "../../../core/base/base.repository";

export class StockTransferRepository extends BaseRepository<"stockTransfer"> {
  constructor() {
    super("stockTransfer");
  }

  // Find transfer by ID with full relations including warehouses and items
  async findByIdWithRelations(id: string) {
    return await this.model.findUnique({
      where: { id },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: {
          include: {
            productVariant: true,
          },
        },
      },
    });
  }

  // Find transfer by unique transfer number
  async findByTransferNumber(transferNumber: string) {
    return await this.model.findUnique({
      where: { transferNumber },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: true,
      },
    });
  }

  // Bulk permanent deletion
  async hardDeleteMany(ids: string[]) {
    return await this.model.deleteMany({
      where: { id: { in: ids } },
    });
  }
}