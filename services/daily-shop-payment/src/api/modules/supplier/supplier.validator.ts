import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class SupplierValidators extends BaseValidator {
  static listSuppliers = z.object({
    query: this.pagination(["name", "email", "phone"]).safeExtend({
      isDeleted: z
        .string()
        .transform((val) => val === "true")
        .default(false),
      searchIn: z
        .string()
        .transform((val) => val.split(","))
        .default(["name", "email", "phone"]),
    }),
  });

  static createSupplier = z.object({
    body: z.object({
      name: z.string().min(1, "Supplier name is required"),
      contactPerson: z.string().optional().nullable(),
      email: z.string().email("Invalid email format").optional().nullable(),
      phone: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
    }),
  });

  static updateSupplier = z.object({
    body: z.object({
      name: z.string().min(1, "Supplier name is required").optional(),
      contactPerson: z.string().optional().nullable(),
      email: z.string().email("Invalid email format").optional().nullable(),
      phone: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      isDeleted: z.boolean().optional(),
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
