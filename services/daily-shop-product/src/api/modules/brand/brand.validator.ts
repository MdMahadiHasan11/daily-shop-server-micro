import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class BrandValidators extends BaseValidator {
  static listBrands = z.object({
    query: this.pagination(["name", "slug"]).safeExtend({
      isDeleted: z
        .string()
        .transform((val) => val === "true")
        .default(false),
    }),
  });

  static createBrand = z.object({
    body: z.object({
      name: z.string().min(1, "Brand name is required"),
      slug: z.string().min(1, "Slug is required"),
      description: z.string().optional().nullable(),
      logo: z.string().url("Invalid logo URL").optional().nullable(),
      website: z.string().url("Invalid website URL").optional().nullable(),
    }),
  });

  static updateBrand = z.object({
    body: z.object({
      name: z.string().min(1, "Brand name is required").optional(),
      slug: z.string().min(1, "Slug is required").optional(),
      description: z.string().optional().nullable(),
      logo: z.string().url("Invalid logo URL").optional().nullable(),
      website: z.string().url("Invalid website URL").optional().nullable(),
      isDeleted: z.boolean().optional(),
    }),
  });

  static bulkOperation = z.object({
    body: z.object({
      ids: z.array(z.string().uuid("Invalid UUID format")).min(1, "At least one ID is required"),
      action: z.enum(["soft-delete", "restore", "hard-delete"], {
        message: "Action must be soft-delete, restore, or hard-delete",
      }),
    }),
  });
}