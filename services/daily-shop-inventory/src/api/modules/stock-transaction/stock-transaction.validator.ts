import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class StockTransactionValidators extends BaseValidator {
  static listTransactions = z.object({
    query: this.pagination(["warehouseId", "productVariantId", "type"]).safeExtend({
      warehouseId: z.string().uuid("Invalid Warehouse ID format").optional(),
      productVariantId: z.string().uuid("Invalid Product Variant ID format").optional(),
      type: z.enum(["STOCK_IN", "STOCK_OUT", "TRANSFER_IN", "TRANSFER_OUT", "ADJUSTMENT"]).optional(),
    }),
  });

  static createTransaction = z.object({
    body: z.object({
      warehouseId: z.string().uuid("Invalid Warehouse ID format"),
      productVariantId: z.string().uuid("Invalid Product Variant ID format"),
      type: z.enum(["STOCK_IN", "STOCK_OUT", "TRANSFER_IN", "TRANSFER_OUT", "ADJUSTMENT"], {
        message: "Invalid stock transaction type",
      }),
      quantity: z.number().int("Quantity must be an integer"),
      referenceId: z.string().optional().nullable(),
      note: z.string().optional().nullable(),
      createdBy: z.string().optional().nullable(),
    }),
  });
}