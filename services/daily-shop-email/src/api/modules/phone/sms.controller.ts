import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { SmsService } from "./sms.service";
import {
  CreateSmsTemplateDto,
  IdParams,
  SmsLogsListQuery,
  SmsTemplateListQuery,
} from "./sms.validator";

export class SmsController extends BaseController {
  private service: SmsService;

  constructor() {
    super();
    this.service = new SmsService();
  }

  createTemplate = this.asyncHandler(async (req: Request, res: Response) => {
    const body = req.validatedBody.body as CreateSmsTemplateDto["body"];
    const result = await this.service.createTemplate(body);
    return this.successResponse(res, result, 201, {
      message: "SMS template created successfully",
    });
  });

  updateTemplate = this.asyncHandler(async (req: Request, res: Response) => {
    const params = req.validatedBody.params as IdParams["params"];
    const result = await this.service.updateTemplate(params.id, req.body);
    return this.successResponse(res, result, 200, {
      message: "SMS template updated successfully",
    });
  });

  deleteTemplate = this.asyncHandler(async (req: Request, res: Response) => {
    const params = req.validatedBody.params as IdParams["params"];
    await this.service.deleteTemplate(params.id);
    return this.successResponse(res, null, 200, {
      message: "SMS template deleted successfully",
    });
  });

  getTemplates = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody.query as SmsTemplateListQuery["query"];
    const result = await this.service.getTemplates(query);
    return this.successResponse(res, result.data, 200, {
      pagination: result.pagination,
    });
  });

  getSmsLogs = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody.query as SmsLogsListQuery["query"];
    const result = await this.service.getSmsLogs(query);
    return this.successResponse(res, result.data, 200, {
      query: query,
      pagination: result.pagination,
    });
  });
}
