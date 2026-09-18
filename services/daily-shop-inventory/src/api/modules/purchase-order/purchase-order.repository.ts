import { BaseRepository } from "../../../core/base/base.repository";

export class PurchaseOrderRepository extends BaseRepository<"purchaseOrder"> {
  constructor() {
    super("purchaseOrder");
  }

  // Find PO by ID with full relations including items, supplier, and warehouse
  async findByIdWithRelations(id: string) {
    return await this.model.findUnique({
      where: { id },
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
  }

  // Find PO by unique PO number
  async findByPoNumber(poNumber: string) {
    return await this.model.findUnique({
      where: { poNumber },
      include: {
        supplier: true,
        warehouse: true,
        items: true,
      },
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