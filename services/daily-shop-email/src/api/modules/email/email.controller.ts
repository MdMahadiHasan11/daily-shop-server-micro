import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { EmailService } from "./email.service";
import {
  CreateTemplateDto,
  IdParams,
  LogsListQuery,
  TemplateListQuery,
} from "./email.validator";

export class EmailController extends BaseController {
  private service: EmailService;

  constructor() {
    super();
    this.service = new EmailService();
  }

  createTemplate = this.asyncHandler(async (req: Request, res: Response) => {
    const body = req.validatedBody.body as CreateTemplateDto["body"];
    const result = await this.service.createTemplate(body);
    return this.successResponse(res, result, 201, {
      message: "Email template created successfully",
    });
  });

  updateTemplate = this.asyncHandler(async (req: Request, res: Response) => {
    const params = req.validatedBody.params as IdParams["params"];
    const result = await this.service.updateTemplate(params.id, req.body);
    return this.successResponse(res, result, 200, {
      message: "Email template updated successfully",
    });
  });

  deleteTemplate = this.asyncHandler(async (req: Request, res: Response) => {
    const params = req.validatedBody.params as IdParams["params"];
    await this.service.deleteTemplate(params.id);
    return this.successResponse(res, null, 200, {
      message: "Email template deleted successfully",
    });
  });

  getTemplates = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody.query as TemplateListQuery["query"];
    const result = await this.service.getTemplates(query);
    return this.successResponse(res, result.data, 200, {
      pagination: result.pagination,
    });
  });

  getEmailLogs = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody.query as LogsListQuery["query"];
    const result = await this.service.getEmailLogs(query);
    return this.successResponse(res, result.data, 200, {
      query: query,
      pagination: result.pagination,
    });
  });
}
