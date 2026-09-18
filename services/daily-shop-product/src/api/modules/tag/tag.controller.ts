import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { TagService } from "./tag.service";

export class TagController extends BaseController {
  private service: TagService;

  constructor() {
    super();
    this.service = new TagService();
  }

  getAllTags = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody?.query || req.query;
    const result = await this.service.getAllTags(query);
    return this.successResponse(res, result.data || result, 200, {
      pagination: result.pagination,
    });
  });

  getTagById = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.getTagById(id);
    return this.successResponse(res, result, 200);
  });

  createTag = this.asyncHandler(async (req: Request, res: Response) => {
    const data = req.validatedBody?.body || req.body;
    const result = await this.service.createTag(data);
    return this.successResponse(res, result, 201, {
      message: "Tag created successfully",
    });
  });

  updateTag = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const data = req.validatedBody?.body || req.body;
    const result = await this.service.updateTag(id, data);
    return this.successResponse(res, result, 200, {
      message: "Tag updated successfully",
    });
  });

  softDeleteTag = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.softDeleteTag(id);
    return this.successResponse(res, result, 200, {
      message: "Tag soft deleted successfully",
    });
  });

  restoreTag = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.restoreTag(id);
    return this.successResponse(res, result, 200, {
      message: "Tag restored successfully",
    });
  });

  hardDeleteTag = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params?.id || req.params.id;
    const result = await this.service.hardDeleteTag(id);
    return this.successResponse(res, result, 200, {
      message: "Tag permanently deleted successfully",
    });
  });

  bulkOperation = this.asyncHandler(async (req: Request, res: Response) => {
    const payload = req.validatedBody?.body || req.body;
    const result = await this.service.handleBulkOperation(payload);
    return this.successResponse(res, result, 200, {
      message: "Bulk operation executed successfully",
    });
  });
}