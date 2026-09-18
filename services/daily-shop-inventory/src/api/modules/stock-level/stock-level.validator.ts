import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class StockLevelValidators extends BaseValidator {
  static listStockLevels = z.object({
    query: this.pagination(["warehouseId", "productVariantId"]).safeExtend({
      warehouseId: z.string().uuid("Invalid Warehouse ID format").optional(),
      productVariantId: z.string().uuid("Invalid Product Variant ID format").optional(),
    }),
  });

  static getStockByQuery = z.object({
    query: z.object({
      warehouseId: z.string().uuid("Invalid Warehouse ID format"),
      productVariantId: z.string().uuid("Invalid Product Variant ID format"),
    }),
  });

  static updateThresholds = z.object({
    body: z.object({
      reorderLevel: z.number().int().nonnegative("Reorder level must be 0 or greater").optional(),
      reorderQuantity: z.number().int().positive("Reorder quantity must be greater than 0").optional(),
    }),
  });

  static lowStockQuery = z.object({
    query: z.object({
      warehouseId: z.string().uuid("Invalid Warehouse ID format").optional(),
    }),
  });
}