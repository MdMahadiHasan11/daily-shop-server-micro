import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class ProductValidators extends BaseValidator {
  static listProducts = z.object({
    query: this.pagination(["name", "sku"]).safeExtend({
      categoryId: z.string().optional(),
      brandId: z.string().optional(),
      isFeatured: z
        .string()
        .transform((val) => val === "true")
        .optional(),
      isBestSeller: z
        .string()
        .transform((val) => val === "true")
        .optional(),
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

  static createProduct = z.object({
    body: z.object({
      name: z.string().min(1, "Product name is required"),
      slug: z.string().min(1, "Slug is required"),
      description: z.string().optional().nullable(),
      categoryId: z.string().min(1, "Category ID is required"),
      brandId: z.string().optional().nullable(),
      isFeatured: z.boolean().optional(),
      isBestSeller: z.boolean().optional(),

      tags: z.array(z.string()).optional(),

      variants: z
        .array(
          z.object({
            sku: z.string().min(1, "SKU is required"),
            barcode: z.string().optional().nullable(),
            name: z.string().min(1, "Variant name is required"),
            price: z.number().positive("Price must be greater than zero"),
            discountPrice: z.number().positive().optional().nullable(),
            costPrice: z.number().positive().optional().nullable(),
            unit: z.string().min(1, "Unit is required (e.g., kg, pcs)"),
            weightValue: z.number().optional().nullable(),
            attributes: z.any().optional(),
            images: z.array(z.string().url()).optional(),
            isDefault: z.boolean().optional(),
          }),
        )
        .min(1, "At least one product variant is required"),
    }),
  });
}

export type ProductListQuery = z.infer<typeof ProductValidators.listProducts>;
