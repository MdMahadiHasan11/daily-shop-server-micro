import { PaginationResult } from "../../../common/interfaces";
import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { CampaignTypeRepository } from "./campaign-type.repository";
import {
  CampaignTypeListQuery,
  CreateCampaignType,
  UpdateCampaignType,
} from "./campaign-type.validator";

export class CampaignTypeService extends BaseService {
  private readonly repository: CampaignTypeRepository;

  constructor() {
    super();
    this.repository = new CampaignTypeRepository();
    this.serviceName = "CampaignTypeService";
  }

  async getAllCampaignTypes(
    query: CampaignTypeListQuery["query"],
  ): Promise<PaginationResult<any>> {
    try {
      return await this.repository.getAllCampaignTypes(query);
    } catch (error) {
      this._handleError(error, "getAllCampaignTypes", { query });
      throw error;
    }
  }

  async getCampaignTypeById(id: string): Promise<any> {
    try {
      const type = await this.repository.getCampaignTypeById(id);
      if (!type) {
        throw new AppError(
          "Campaign type not found",
          404,
          true,
          undefined,
          "CAMPAIGN_TYPE_NOT_FOUND",
        );
      }
      return type;
    } catch (error) {
      this._handleError(error, "getCampaignTypeById", { id });
      throw error;
    }
  }

  async createCampaignType(data: CreateCampaignType["body"]): Promise<any> {
    try {
      return await this.repository.createCampaignType(data);
    } catch (error) {
      this._handleError(error, "createCampaignType", { data });
      throw error;
    }
  }

  async updateCampaignType(
    id: string,
    data: UpdateCampaignType["body"],
  ): Promise<any> {
    try {
      await this.getCampaignTypeById(id);
      return await this.repository.updateCampaignType(id, data);
    } catch (error) {
      this._handleError(error, "updateCampaignType", { id, data });
      throw error;
    }
  }

  async deleteCampaignType(
    id: string,
    permanent: boolean = false,
  ): Promise<any> {
    try {
      await this.getCampaignTypeById(id);
      return await this.repository.deleteCampaignType(id, permanent);
    } catch (error) {
      this._handleError(error, "deleteCampaignType", { id, permanent });
      throw error;
    }
  }
}
