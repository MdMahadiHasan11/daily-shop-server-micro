import { BaseRepository } from "../../../core/base/base.repository";

export class StockTransactionRepository extends BaseRepository<"stockTransaction"> {
  constructor() {
    super("stockTransaction");
  }

  // Find transaction by ID with relations
  async findByIdWithRelations(id: string) {
    return await this.model.findUnique({
      where: { id },
      include: {
        warehouse: true,
        productVariant: true,
      },
    });
  }
}