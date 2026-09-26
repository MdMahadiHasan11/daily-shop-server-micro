import { PaginationResult } from "../../../common/interfaces";
import { BaseRepository } from "../../../core/base/base.repository";
import { CampaignTypeListQuery } from "./campaign-type.validator";

export class CampaignTypeRepository extends BaseRepository<"campaignTypeModel"> {
  constructor() {
    super("campaignTypeModel" as any);
  }

  async getAllCampaignTypes(
    query: CampaignTypeListQuery["query"],
  ): Promise<PaginationResult<any>> {
    return await this.getList(query, {
      include: {
        campaigns: true,
      },
    });
  }
  

  async getCampaignTypeById(id: string) {
    return await this.model.findUnique({
      where: { id },
      include: {
        campaigns: true,
      },
    });
  }

  async createCampaignType(data: any) {
    return await this.model.create({
      data,
    });
  }

  async updateCampaignType(id: string, data: any) {
    return await this.model.update({
      where: { id },
      data,
    });
  }

  async deleteCampaignType(id: string, permanent: boolean = false) {
    if (permanent) {
      return await this.model.delete({
        where: { id },
      });
    } else {
      return await this.model.update({
        where: { id },
        data: { isActive: false },
      });
    }
  }
}
