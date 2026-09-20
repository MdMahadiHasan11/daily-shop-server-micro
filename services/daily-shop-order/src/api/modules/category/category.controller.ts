import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { CategoryService } from "./category.service";
import { CategoryCreate, CategoryListQuery } from "./category.validator";

export class CategoryController extends BaseController {
  private service: CategoryService;

  constructor() {
    super();
    this.service = new CategoryService();
  }

  getAllCategories = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody.query as CategoryListQuery["query"];
    const result = await this.service.getAllCategories(query);
    return this.successResponse(res, result.data, 200, {
      pagination: result.pagination,
      query,
    });
  });

  getCategoryById = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params.id as string;
    const result = await this.service.getCategoryDetails(id);
    return this.successResponse(res, result, 200);
  });

  createCategory = this.asyncHandler(async (req: Request, res: Response) => {
    const data = req.validatedBody.body as CategoryCreate["body"];
    const result = await this.service.createCategory(data);
    return this.successResponse(res, result, 201, {
      message: "Category created successfully",
    });
  });

  updateCategory = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params.id as string;
    const data = req.validatedBody.body;
    const result = await this.service.updateCategory(id, data);
    return this.successResponse(res, result, 200, {
      message: "Category updated successfully",
    });
  });

  // Soft Delete
  deleteCategory = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params.id as string;
    const result = await this.service.deleteCategory(id);
    return this.successResponse(res, result, 200, {
      message: "Category deleted successfully",
    });
  });

  // Restore (Recover Soft Deleted Category)
  restoreCategory = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params.id as string;
    const result = await this.service.restoreCategory(id);
    return this.successResponse(res, result, 200, {
      message: "Category restored successfully",
    });
  });

  // Hard Delete (Permanent Delete from Database)
  hardDeleteCategory = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody?.params.id as string;
    const result = await this.service.hardDeleteCategory(id);
    return this.successResponse(res, result, 200, {
      message: "Category permanently deleted successfully",
    });
  });
}