import { PaymentGateway } from "@prisma/client";
import { z } from "zod";
import { BaseValidator } from "../../../core/base/base.validator";

export class PaymentValidators extends BaseValidator {
  static listPayment = z.object({
    query: this.pagination(["orderId", "paymentNumber"]).safeExtend({
      status: z.string().optional(),
      paymentNumber: z.string().optional(),
      userId: z.string().optional(),
      orderId: z.string().optional(),
      isDeleted: z
        .string()
        .transform((val) => val === "true")
        .default(false),
      searchIn: z
        .string()
        .transform((val) => val.split(","))
        .default(["orderId", "paymentNumber"]),
    }),
  });

  static initiatePayment = z.object({
    body: z.object({
      paymentGateway: z.nativeEnum(PaymentGateway),
    }),
    params: z.object({
      orderId: z.string().uuid("Invalid Order ID format"),
    }),
  });

  static getByIdPayment = z.object({
    params: z.object({
      id: z.string().uuid("Invalid Payment ID format"),
    }),
  });
}
export type InitiatePaymentInput = z.infer<
  typeof PaymentValidators.initiatePayment
>;

export type IdPaymentInput = z.infer<typeof PaymentValidators.getByIdPayment>;
export type ListPaymentQuery = z.infer<typeof PaymentValidators.listPayment>;
