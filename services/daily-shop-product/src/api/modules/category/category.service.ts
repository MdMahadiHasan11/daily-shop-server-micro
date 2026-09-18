import { PaginationResult } from "../../../common/interfaces";
import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { CategoryRepository } from "./category.repository";
import { CategoryListQuery } from "./category.validator";

export class CategoryService extends BaseService {
  private readonly repository: CategoryRepository;

  constructor() {
    super();
    this.repository = new CategoryRepository();
    this.serviceName = "CategoryService";
  }

  async getAllCategories(
    query: CategoryListQuery["query"],
  ): Promise<PaginationResult<any>> {
    try {
      return await this.repository.getAllCategories(query);
    } catch (error) {
      this._handleError(error, "getAllCategories", { query });
      throw error;
    }
  }

  async getCategoryDetails(id: string): Promise<any> {
    try {
      const category = await this.repository.getCategoryById(id);
      if (!category) {
        throw new AppError(
          "Category not found",
          404,
          true,
          undefined,
          "CATEGORY_NOT_FOUND",
        );
      }
      return category;
    } catch (error) {
      this._handleError(error, "getCategoryDetails", { id });
      throw error;
    }
  }

  async createCategory(createData: any): Promise<any> {
    try {
      return await this.repository.create(createData);
    } catch (error) {
      this._handleError(error, "createCategory", { createData });
      throw error;
    }
  }

  async updateCategory(id: string, updateData: any): Promise<any> {
    try {
      await this.getCategoryDetails(id);
      return await this.repository.update(id, updateData);
    } catch (error) {
      this._handleError(error, "updateCategory", { id, updateData });
      throw error;
    }
  }

  // ১. Soft Delete (BaseRepository এর softDelete মেথড ব্যবহার করে)
  async deleteCategory(id: string): Promise<any> {
    try {
      await this.getCategoryDetails(id);
      return await this.repository.softDelete(id);
    } catch (error) {
      this._handleError(error, "deleteCategory", { id });
      throw error;
    }
  }

  // ২. Restore / Recover (BaseRepository এর recover মেথড ব্যবহার করে)
  async restoreCategory(id: string, companyId?: string | number): Promise<any> {
    try {
      const category = await this.repository.getCategoryIncludingDeleted(id);
      if (!category) {
        throw new AppError(
          "Category not found",
          404,
          true,
          undefined,
          "CATEGORY_NOT_FOUND",
        );
      }
      
      // যদি আপনার মডেলে companyId থাকে তবে তা পাস করতে হবে, না থাকলে সরাসরি আপডেট করতে পারেন
      return await this.repository.update(id, { isDeleted: false });
    } catch (error) {
      this._handleError(error, "restoreCategory", { id });
      throw error;
    }
  }

  // ৩. Hard Delete (BaseRepository এর hardDelete মেথড ব্যবহার করে)
  async hardDeleteCategory(id: string): Promise<any> {
    try {
      const category = await this.repository.getCategoryIncludingDeleted(id);
      if (!category) {
        throw new AppError(
          "Category not found",
          404,
          true,
          undefined,
          "CATEGORY_NOT_FOUND",
        );
      }
      return await this.repository.hardDelete(id);
    } catch (error) {
      this._handleError(error, "hardDeleteCategory", { id });
      throw error;
    }
  }
}