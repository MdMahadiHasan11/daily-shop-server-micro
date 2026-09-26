import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { CampaignService } from "./campaign.service";
import {
  CampaignListQuery,
  CreateCampaign,
  UpdateCampaign,
} from "./campaign.validator";

export class CampaignController extends BaseController {
  private service: CampaignService;

  constructor() {
    super();
    this.service = new CampaignService();
  }

  getAllCampaigns = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody.query as CampaignListQuery["query"];
    const result = await this.service.getAllCampaigns(query);
    return this.successResponse(res, result.data, 200, {
      pagination: result.pagination,
      query,
    });
  });

  getCampaignBySlug = this.asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const result = await this.service.getCampaignDetailsBySlug(slug as string);
    return this.successResponse(res, result, 200);
  });

  createCampaign = this.asyncHandler(async (req: Request, res: Response) => {
    const campaignData = req.validatedBody.body as CreateCampaign["body"];
    const result = await this.service.createCampaign(campaignData);
    return this.successResponse(res, result, 201, {
      message: "Campaign created successfully with products",
    });
  });

  softDeleteCampaign = this.asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const result = await this.service.deleteCampaign(id as string, false);
      return this.successResponse(res, result, 200, {
        message: "Campaign deactivated successfully",
      });
    },
  );

  hardDeleteCampaign = this.asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const result = await this.service.deleteCampaign(id as string, true);
      return this.successResponse(res, result, 200, {
        message: "Campaign deleted permanently",
      });
    },
  );

  updateStock = this.asyncHandler(async (req: Request, res: Response) => {
    const stockData = req.validatedBody.body;
    const result = await this.service.updateStockOnOrder(stockData);
    return this.successResponse(res, result, 200, {
      message: "Campaign stock updated successfully",
    });
  });

  addProductsToCampaign = this.asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { products } = req.validatedBody.body;
      const result = await this.service.addProductsToCampaign(
        id as string,
        products,
      );
      return this.successResponse(res, result, 200, {
        message: "Products added to campaign successfully",
      });
    },
  );

  updateCampaign = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.validatedBody.body as UpdateCampaign["body"];
    const result = await this.service.updateCampaign(id as string, updateData);
    return this.successResponse(res, result, 200, {
      message: "Campaign and products updated successfully",
    });
  });
}
