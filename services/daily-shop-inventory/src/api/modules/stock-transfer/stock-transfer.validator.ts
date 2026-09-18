import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class StockTransferValidators extends BaseValidator {
  static listTransfers = z.object({
    query: this.pagination(["transferNumber", "status"]).safeExtend({
      fromWarehouseId: z.string().uuid("Invalid Source Warehouse ID format").optional(),
      toWarehouseId: z.string().uuid("Invalid Destination Warehouse ID format").optional(),
      status: z.enum(["PENDING", "IN_TRANSIT", "COMPLETED", "CANCELLED"]).optional(),
    }),
  });

  static createTransfer = z.object({
    body: z.object({
      transferNumber: z.string().min(1, "Transfer number is required"),
      fromWarehouseId: z.string().uuid("Invalid Source Warehouse ID format"),
      toWarehouseId: z.string().uuid("Invalid Destination Warehouse ID format"),
      status: z.enum(["PENDING", "IN_TRANSIT", "COMPLETED", "CANCELLED"]).optional().default("PENDING"),
      notes: z.string().optional().nullable(),
      items: z
        .array(
          z.object({
            productVariantId: z.string().uuid("Invalid Product Variant ID format"),
            quantity: z.number().int().positive("Transfer quantity must be greater than 0"),
          })
        )
        .min(1, "At least one transfer item is required"),
    }),
  });

  static updateStatus = z.object({
    body: z.object({
      status: z.enum(["PENDING", "IN_TRANSIT", "COMPLETED", "CANCELLED"], {
        message: "Status must be PENDING, IN_TRANSIT, COMPLETED, or CANCELLED",
      }),
      notes: z.string().optional().nullable(),
    }),
  });

  static bulkOperation = z.object({
    body: z.object({
      ids: z.array(z.string().uuid("Invalid UUID format")).min(1, "At least one ID is required"),
      action: z.literal("hard-delete", {
        message: "Action must be hard-delete",
      }),
    }),
  });
}