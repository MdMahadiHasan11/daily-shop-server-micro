import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class CartValidators extends BaseValidator {
  static listCart = z.object({
    query: this.pagination(["productVariantId"]).safeExtend({
      isReserved: z
        .string()
        .transform((val) => val === "true")
        .optional(),
    }),
  });

  static addToCart = z.object({
    body: z.object({
      productVariantId: z.string().min(1, "Product Variant ID is required"),
      quantity: z
        .number()
        .int("Quantity must be an integer")
        .positive("Quantity must be greater than zero")
        .default(1),
    }),
  });
  static updateItemQuantity = z.object({
    body: z.object({
      productVariantId: z.string().min(1, "Product Variant ID is required"),
      quantity: z.number().int().min(0, "Quantity cannot be negative"),
    }),
  });

  static removeItem = z.object({
    params: z.object({
      productVariantId: z.string().min(1, "Product Variant ID is required"),
    }),
  });
}

export type AddToCartInput = z.infer<typeof CartValidators.addToCart>;
export type CartListQuery = z.infer<typeof CartValidators.listCart>;
