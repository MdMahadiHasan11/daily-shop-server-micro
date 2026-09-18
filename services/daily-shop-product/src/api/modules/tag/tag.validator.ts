import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class TagValidators extends BaseValidator {
  static listTags = z.object({
    query: this.pagination(["name", "slug"]).safeExtend({
      isDeleted: z
        .string()
        .transform((val) => val === "true")
        .default(false),
    }),
  });

  static createTag = z.object({
    body: z.object({
      name: z.string().min(1, "Tag name is required"),
      slug: z.string().min(1, "Slug is required"),
    }),
  });

  static updateTag = z.object({
    body: z.object({
      name: z.string().min(1, "Tag name is required").optional(),
      slug: z.string().min(1, "Slug is required").optional(),
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