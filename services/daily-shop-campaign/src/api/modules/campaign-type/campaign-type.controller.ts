import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { CampaignTypeService } from "./campaign-type.service";
import {
  CampaignTypeListQuery,
  CreateCampaignType,
  UpdateCampaignType,
} from "./campaign-type.validator";

export class CampaignTypeController extends BaseController {
  private service: CampaignTypeService;

  constructor() {
    super();
    this.service = new CampaignTypeService();
  }

  getAll = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody.query as CampaignTypeListQuery["query"];
    const result = await this.service.getAllCampaignTypes(query);
    return this.successResponse(res, result.data, 200, {
      message: "Gel All Type Successful.",
      pagination: result.pagination,
      query,
    });
  });

  getById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.getCampaignTypeById(id as string);
    return this.successResponse(res, result, 200);
  });

  create = this.asyncHandler(async (req: Request, res: Response) => {
    const data = req.validatedBody.body as CreateCampaignType["body"];
    const result = await this.service.createCampaignType(data);
    return this.successResponse(res, result, 201, {
      message: "Campaign type created successfully",
    });
  });

  update = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.validatedBody.body as UpdateCampaignType["body"];
    const result = await this.service.updateCampaignType(id as string, data);
    return this.successResponse(res, result, 200, {
      message: "Campaign type updated successfully",
    });
  });

  softDelete = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.deleteCampaignType(id as string, false);
    return this.successResponse(res, result, 200, {
      message: "Campaign type deactivated successfully",
    });
  });

  hardDelete = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.deleteCampaignType(id as string, true);
    return this.successResponse(res, result, 200, {
      message: "Campaign type deleted permanently",
    });
  });
}
