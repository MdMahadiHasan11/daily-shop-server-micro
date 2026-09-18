import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class ProductSyncValidators extends BaseValidator {
  static syncVariant = z.object({
    body: z.object({
      id: z.string().uuid("Invalid Product Variant ID format"),
      productId: z.string().min(1, "Product ID is required"),
      sku: z.string().min(1, "SKU is required"),
      barcode: z.string().optional().nullable(),
      name: z.string().min(1, "Product name is required"),
      price: z.number().positive("Price must be a positive number"),
      discountPrice: z.number().positive("Discount price must be positive").optional().nullable(),
      costPrice: z.number().positive("Cost price must be positive").optional().nullable(),
      unit: z.string().min(1, "Unit is required"),
      weightValue: z.number().positive("Weight must be positive").optional().nullable(),
      attributes: z.record(z.string(), z.any()).optional().nullable(),
      images: z.array(z.string()).optional(),
      isDefault: z.boolean().optional(),
    }),
  });

  static getVariantById = z.object({
    params: z.object({
      id: z.string().uuid("Invalid Product Variant ID format"),
    }),
  });
}