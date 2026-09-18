import { BaseRepository } from "../../../core/base/base.repository";

export class BrandRepository extends BaseRepository<"brand"> {
  constructor() {
    super("brand");
  }

  // ok
  async findByIdIncludingDeleted(id: string) {
    return await this.model.findUnique({
      where: { id },
    });
  }

  // মাল্টিপল সফট ডিলিট অথবা রিস্টোর (এক সাথে অনেকগুলো)
  async updateManyStatus(ids: string[], isDeleted: boolean) {
    return await this.model.updateMany({
      where: { id: { in: ids } },
      data: { isDeleted },
    });
  }

  // মাল্টিপল হার্ড ডিলিট (স্থায়ীভাবে মুছে ফেলা)
  async hardDeleteMany(ids: string[]) {
    return await this.model.deleteMany({
      where: { id: { in: ids } },
    });
  }
}