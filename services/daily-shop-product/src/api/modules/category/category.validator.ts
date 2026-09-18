import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class CategoryValidators extends BaseValidator {
  static listCategories = z.object({
    query: this.pagination(["name", "slug"]).safeExtend({
      parentId: z.string().optional().nullable(),
      view: z.string().optional(),
      isDeleted: z
        .string()
        .transform((val) => val === "true")
        .default(false),
      searchIn: z
        .string()
        .transform((val) => val.split(","))
        .default(["name"]),
    }),
  });

  static getById = this.idParams;

  static createCategory = z.object({
    body: z.object({
      name: z.string().min(1, "Category name is required"),
      slug: z.string().min(1, "Slug is required"),
      image: z.string().url("Invalid image URL").optional().nullable(),
      description: z.string().optional().nullable(),
      parentId: z.string().optional().nullable(),
    }),
  });

  static updateCategory = z.object({
    params: z.object({
      id: z.string().min(1, "Category ID is required"),
    }),
    body: z.object({
      name: z.string().min(1, "Category name cannot be empty").optional(),
      slug: z.string().min(1, "Slug cannot be empty").optional(),
      image: z.string().url("Invalid image URL").optional().nullable(),
      description: z.string().optional().nullable(),
    }),
  });
}

export type CategoryListQuery = z.infer<
  typeof CategoryValidators.listCategories
>;
export type CategoryCreate = z.infer<typeof CategoryValidators.createCategory>;
export type CategoryUpdate = z.infer<typeof CategoryValidators.updateCategory>;
