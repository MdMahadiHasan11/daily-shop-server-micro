import { BaseRepository } from "../../../core/base/base.repository";

export class SupplierRepository extends BaseRepository<"supplier"> {
  constructor() {
    super("supplier");
  }

  // Find a supplier by ID including soft-deleted ones (needed for restore/hard-delete checks)
  async findByIdIncludingDeleted(id: string) {
    return await this.model.findUnique({
      where: { id },
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