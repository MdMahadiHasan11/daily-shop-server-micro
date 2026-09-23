import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class WarehouseValidators extends BaseValidator {
  static listWarehouses = z.object({
    query: this.pagination(["name", "code"]).safeExtend({
      isDeleted: z
        .string()
        .transform((val) => val === "true")
        .default(false),
      searchIn: z
        .string()
        .transform((val) => val.split(","))
        .default(["name", "code"]),
    }),
  });

  static createWarehouse = z.object({
    body: z.object({
      name: z.string().min(1, "Warehouse name is required"),
      code: z.string().min(1, "Warehouse code is required"),
      address: z.string().optional().nullable(),
      isMain: z.boolean().optional().default(false),
    }),
  });

  static updateWarehouse = z.object({
    body: z.object({
      name: z.string().min(1, "Warehouse name is required").optional(),
      code: z.string().min(1, "Warehouse code is required").optional(),
      address: z.string().optional().nullable(),
      isMain: z.boolean().optional(),
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

  static StockOperation = z.object({
    body: z.object({
      variantIds: z
        .array(z.string().uuid("Invalid UUID format"))
        .min(1, "At least one variant ID is required"),
      customerCity: z.string().min(1, "Customer city is required"),
    }),
  });
}

export type StockOperation = z.infer<typeof WarehouseValidators.StockOperation>;
