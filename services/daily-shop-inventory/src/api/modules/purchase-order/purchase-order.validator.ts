import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class PurchaseOrderValidators extends BaseValidator {
  static listPurchaseOrders = z.object({
    query: this.pagination(["poNumber", "status"]).safeExtend({
      supplierId: z.string().uuid("Invalid Supplier ID format").optional(),
      warehouseId: z.string().uuid("Invalid Warehouse ID format").optional(),
      status: z
        .enum(["PENDING", "APPROVED", "ORDERED", "RECEIVED", "CANCELLED"])
        .optional(),
      isDeleted: z
        .string()
        .transform((val) => val === "true")
        .default(false),
      searchIn: z
        .string()
        .transform((val) => val.split(","))
        .default(["email", "phoneNumber"]),
    }),
  });

  static createPurchaseOrder = z.object({
    body: z.object({
      poNumber: z.string().min(1, "PO number is required"),
      supplierId: z.string().uuid("Invalid Supplier ID format"),
      warehouseId: z.string().uuid("Invalid Warehouse ID format"),
      status: z
        .enum(["PENDING", "APPROVED", "ORDERED", "RECEIVED", "CANCELLED"])
        .optional()
        .default("PENDING"),
      totalAmount: z
        .number()
        .positive("Total amount must be positive")
        .optional(),
      expectedDate: z
        .string()
        .datetime("Invalid expected date format")
        .optional()
        .nullable(),
      notes: z.string().optional().nullable(),
      items: z
        .array(
          z.object({
            productVariantId: z
              .string()
              .uuid("Invalid Product Variant ID format"),
            orderedQuantity: z
              .number()
              .int()
              .positive("Ordered quantity must be greater than 0"),
            unitCost: z.number().positive("Unit cost must be positive"),
          }),
        )
        .min(1, "At least one purchase order item is required"),
    }),
  });

  static updatePurchaseOrder = z.object({
    body: z.object({
      status: z
        .enum(["PENDING", "APPROVED", "ORDERED", "RECEIVED", "CANCELLED"])
        .optional(),
      expectedDate: z
        .string()
        .datetime("Invalid expected date format")
        .optional()
        .nullable(),
      notes: z.string().optional().nullable(),
      isDeleted: z.boolean().optional(),
    }),
  });

  static receivePurchaseOrder = z.object({
    body: z.object({
      receivedDate: z
        .string()
        .datetime("Invalid received date format")
        .optional()
        .nullable(),
      notes: z.string().optional().nullable(),
    }),
  });

  static bulkOperation = z.object({
    body: z.object({
      ids: z
        .array(z.string().uuid("Invalid UUID format"))
        .min(1, "At least one ID is required"),
      action: z.enum(["soft-delete", "restore", "hard-delete"], {
        message: "Action must be soft-delete, restore, or hard-delete",
      }),
    }),
  });
}
