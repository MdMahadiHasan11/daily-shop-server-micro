import { BaseRepository } from "../../../core/base/base.repository";

export class TagRepository extends BaseRepository<"tag"> {
  constructor() {
    super("tag");
  }

 
  async findByIdIncludingDeleted(id: string) {
    return await this.model.findUnique({
      where: { id },
    });
  }

  
  async updateManyStatus(ids: string[], isDeleted: boolean) {
    return await this.model.updateMany({
      where: { id: { in: ids } },
      data: { isDeleted },
    });
  }

  async hardDeleteMany(ids: string[]) {
    return await this.model.deleteMany({
      where: { id: { in: ids } },
    });
  }
}