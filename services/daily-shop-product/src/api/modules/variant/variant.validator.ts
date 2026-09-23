import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class ProductVariantValidators extends BaseValidator {
  static listProductsVariant = z.object({
    query: this.pagination(["name", "sku", "barcode"]).safeExtend({
      productId: z.string().optional(),
      isDeleted: z
        .string()
        .transform((val) => val === "true")
        .default(false),
      searchIn: z
        .string()
        .transform((val) => val.split(","))
        .default(["name", "sku", "barcode"]),
    }),
  });

  static createProductVariant = z.object({
    body: z.object({
      productId: z.string().uuid("Invalid product ID"),
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

  static getBulkVariants = z.object({
    body: z.object({
      variantIds: z
        .array(z.string().min(1))
        .min(1, "At least one variant ID is required"),
    }),
  });

  static getParamsId = z.object({
    params: z.object({
      id: z.string(),
    }),
  });
}

export type ProductVariantListQuery = z.infer<
  typeof ProductVariantValidators.listProductsVariant
>;

export type GetParamsId = z.infer<typeof ProductVariantValidators.getParamsId>;
export type ProductVariantCreate = z.infer<
  typeof ProductVariantValidators.createProductVariant
>;
