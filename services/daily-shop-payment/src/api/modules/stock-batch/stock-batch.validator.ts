import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class StockBatchValidators extends BaseValidator {
  static listBatches = z.object({
    query: this.pagination(["batchNumber", "productVariantId", "warehouseId"]).safeExtend({
      warehouseId: z.string().uuid("Invalid Warehouse ID format").optional(),
      productVariantId: z.string().uuid("Invalid Product Variant ID format").optional(),
      isDeleted: z
        .string()
        .transform((val) => val === "true")
        .default(false),
    }),
  });

  static createBatch = z.object({
    body: z.object({
      batchNumber: z.string().min(1, "Batch number is required"),
      productVariantId: z.string().uuid("Invalid Product Variant ID format"),
      warehouseId: z.string().uuid("Invalid Warehouse ID format"),
      initialQuantity: z.number().int().positive("Initial quantity must be greater than 0"),
      currentQuantity: z.number().int().nonnegative("Current quantity must be 0 or greater").optional(),
      purchasePrice: z.number().positive("Purchase price must be positive").optional().nullable(),
      mfgDate: z.string().datetime("Invalid manufacturing date format").optional().nullable(),
      expiryDate: z.string().datetime("Invalid expiry date format").optional().nullable(),
    }),
  });

  static updateBatch = z.object({
    body: z.object({
      currentQuantity: z.number().int().nonnegative("Current quantity must be 0 or greater").optional(),
      purchasePrice: z.number().positive("Purchase price must be positive").optional().nullable(),
      mfgDate: z.string().datetime("Invalid manufacturing date format").optional().nullable(),
      expiryDate: z.string().datetime("Invalid expiry date format").optional().nullable(),
      isDeleted: z.boolean().optional(),
    }),
  });

  static expiringQuery = z.object({
    query: z.object({
      days: z.string().transform((val) => parseInt(val, 10)).optional(),
      warehouseId: z.string().uuid("Invalid Warehouse ID format").optional(),
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