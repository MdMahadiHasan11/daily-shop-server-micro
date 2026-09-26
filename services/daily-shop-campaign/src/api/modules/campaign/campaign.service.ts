import { PaginationResult } from "../../../common/interfaces";
import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { CampaignRepository } from "./campaign.repository";
import { CampaignListQuery } from "./campaign.validator";

export class CampaignService extends BaseService {
  private readonly repository: CampaignRepository;

  constructor() {
    super();
    this.repository = new CampaignRepository();
    this.serviceName = "CampaignService";
  }

  async getAllCampaigns(
    query: CampaignListQuery["query"],
  ): Promise<PaginationResult<any>> {
    try {
      return await this.repository.getAllCampaigns(query);
    } catch (error) {
      this._handleError(error, "getAllCampaigns", { query });
      throw error;
    }
  }

  async getCampaignDetailsBySlug(slug: string): Promise<any> {
    try {
      const campaignDetails =
        await this.repository.getCampaignDetailsBySlug(slug);
      if (!campaignDetails) {
        throw new AppError(
          "Campaign not found",
          404,
          true,
          undefined,
          "CAMPAIGN_NOT_FOUND",
        );
      }
      return campaignDetails;
    } catch (error) {
      this._handleError(error, "getCampaignDetailsBySlug", { slug });
      throw error;
    }
  }

  async createCampaign(createData: any): Promise<any> {
    try {
      return await this.repository.createCampaignWithProducts(createData);
    } catch (error) {
      this._handleError(error, "createCampaign", { createData });
      throw error;
    }
  }

  async deleteCampaign(id: string, permanent: boolean = false): Promise<any> {
    try {
      return await this.repository.deleteCampaign(id, permanent);
    } catch (error) {
      this._handleError(error, "deleteCampaign", { id, permanent });
      throw error;
    }
  }

  async updateStockOnOrder(data: {
    campaignId: string;
    productId: string;
    productVariantId?: string | null;
    quantity: number;
  }): Promise<any> {
    try {
      return await this.repository.incrementSoldCount(data);
    } catch (error) {
      this._handleError(error, "updateStockOnOrder", { data });
      throw error;
    }
  }

  async addProductsToCampaign(
    campaignId: string,
    products: any[],
  ): Promise<any> {
    try {
      return await this.repository.addProductsToCampaign(campaignId, products);
    } catch (error) {
      this._handleError(error, "addProductsToCampaign", {
        campaignId,
        products,
      });
      throw error;
    }
  }

  async updateCampaign(id: string, updateData: any): Promise<any> {
    try {
      return await this.repository.updateCampaignWithProducts(id, updateData);
    } catch (error) {
      this._handleError(error, "updateCampaign", { id, updateData });
      throw error;
    }
  }
}
