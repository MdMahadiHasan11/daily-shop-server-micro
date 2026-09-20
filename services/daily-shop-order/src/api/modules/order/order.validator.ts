import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class OrderValidators extends BaseValidator {
  static listOrders = z.object({
    query: this.pagination(["orderNumber", "shippingPhone"]).safeExtend({
      status: z.string().optional(),
      paymentStatus: z.string().optional(),
      paymentMethod: z.string().optional(),
      userId: z.string().optional(),
      isDeleted: z
        .string()
        .transform((val) => val === "true")
        .default(false),
      searchIn: z
        .string()
        .transform((val) => val.split(","))
        .default(["orderNumber", "shippingPhone"]),
    }),
  });

  static createOrder = z.object({
    body: z.object({
      userAddressId: z.string().optional().nullable(),
      paymentMethod: z.enum(["COD", "ONLINE", "WALLET"]).default("COD"),
      shippingName: z.string().min(1, "Shipping name is required"),
      shippingPhone: z.string().min(1, "Shipping phone is required"),
      shippingEmail: z.string().email().optional().nullable(),
      shippingAddress: z.string().min(1, "Shipping address is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().optional().nullable(),
      postalCode: z.string().optional().nullable(),
      country: z.string().default("Bangladesh"),
      notes: z.string().optional().nullable(),

      items: z
        .array(
          z.object({
            productVariantId: z
              .string()
              .min(1, "Product Variant ID is required"),
            quantity: z
              .number()
              .int()
              .positive("Quantity must be greater than zero"),
          }),
        )
        .min(1, "At least one item is required in the order"),
    }),
  });

  static updateOrderStatus = z.object({
    body: z.object({
      status: z.enum([
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "REFUNDED",
      ]),
      note: z.string().optional().nullable(),
    }),
    params: z.object({
      id: z.string(),
    }),
  });
}

export type OrderListQuery = z.infer<typeof OrderValidators.listOrders>;
export type OrderCreate = z.infer<typeof OrderValidators.createOrder>;
export type OrderUpdate = z.infer<typeof OrderValidators.updateOrderStatus>;
