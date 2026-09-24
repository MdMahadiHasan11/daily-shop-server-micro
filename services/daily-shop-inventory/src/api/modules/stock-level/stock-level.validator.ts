import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class StockLevelValidators extends BaseValidator {
  static listStockLevels = z.object({
    query: this.pagination(["warehouseId", "productVariantId"]).safeExtend({
      warehouseId: z.string().uuid("Invalid Warehouse ID format").optional(),
      productVariantId: z
        .string()
        .uuid("Invalid Product Variant ID format")
        .optional(),
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
      reorderLevel: z
        .number()
        .int()
        .nonnegative("Reorder level must be 0 or greater")
        .optional(),
      reorderQuantity: z
        .number()
        .int()
        .positive("Reorder quantity must be greater than 0")
        .optional(),
    }),
  });

  static lowStockQuery = z.object({
    query: z.object({
      warehouseId: z.string().uuid("Invalid Warehouse ID format").optional(),
    }),
  });
  static getStockCheckSchema = z.object({
    query: z.object({
      fields: z.enum(["minimal"]).optional(),
    }),
    params: z.object({
      productVariantId: z.string().uuid("Invalid Product Variant ID format"),
    }),
  });

  static listStockExpired = z.object({
    query: this.pagination(["warehouseId", "productVariantId"]).safeExtend({
      warehouseId: z.string().uuid("Invalid Warehouse ID format").optional(),
      productVariantId: z
        .string()
        .uuid("Invalid Product Variant ID format")
        .optional(),
    }),
  });

  static allocationPlanItemSchema = z.object({
    branchId: z.string().uuid("Invalid Branch ID format"),
    variantId: z.string().uuid("Invalid Variant ID format"),
    allocatedQty: z
      .number()
      .int()
      .positive("Allocated quantity must be greater than 0"),
  });

  static allocationPlanStockHold = z.object({
    body: z.object({
      orderId: z.string().uuid("Invalid Order ID format"),
      orderNumber: z.string().min(1, "Order number is required"),
      allocationPlan: z
        .array(this.allocationPlanItemSchema)
        .min(1, "Allocation plan cannot be empty"),
    }),
  });
}

export type StockCheck = z.infer<
  typeof StockLevelValidators.getStockCheckSchema
>;

export type StockExpired = z.infer<
  typeof StockLevelValidators.listStockExpired
>;

export type CreateAllocationPlan = z.infer<
  typeof StockLevelValidators.allocationPlanStockHold
>;
