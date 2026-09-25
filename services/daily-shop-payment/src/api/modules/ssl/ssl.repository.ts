import { PaymentGateway, PaymentStatus } from "@prisma/client";
import axios from "axios";
import { BaseRepository } from "../../../core/base/base.repository";
import { env } from "../../../core/config/env.config";
import { AppError } from "../../../core/errors/errors";
import { logger } from "../../../core/utils/logger.utils";

export class SSLRepository extends BaseRepository<"payment"> {
  constructor() {
    super("payment");
  }

  // Fetch order details from Order Microservice
  async getOrderFromService(orderId: string) {
    try {
      const response = await this.service.get("order", `/${orderId}`);
      return response.data;
    } catch (err) {
      logger.error("Failed to fetch order from Order Service:");
      return null;
    }
  }

  // Find payment record by transaction ID (paymentNumber)
  async getPaymentById(paymentNumber: string) {
    return await this.model.findFirst({
      where: {
        paymentNumber,
        isDeleted: false,
      },
      include: {
        logs: true,
      },
    });
  }

  // Handle full payment confirmation workflow inside the repository
  async processPaymentConfirmation(transactionId: string, gatewayPayload: any) {
    // 1. Validate gateway response status
    if (
      !gatewayPayload ||
      (gatewayPayload.status !== "VALID" &&
        gatewayPayload.status !== "VALIDATED")
    ) {
      throw new AppError(
        "Invalid or failed payment response from gateway",
        400,
        true,
        undefined,
        "INVALID_GATEWAY_PAYMENT",
      );
    }

    // 2. Fetch payment record from DB
    const existingPayment = await this.getPaymentById(transactionId);

    if (!existingPayment) {
      throw new AppError(
        `Payment record not found for transaction ID: ${transactionId}`,
        404,
        true,
        undefined,
        "PAYMENT_NOT_FOUND",
      );
    }

    // 3. Return early if already paid
    if (existingPayment.status === PaymentStatus.PAID) {
      return existingPayment;
    }

    // 4. Update payment status and create audit logs inside transaction
    const updatedPayment = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: PaymentStatus.PAID,
          gatewayTransactionId:
            gatewayPayload.val_id ||
            gatewayPayload.bank_tran_id ||
            gatewayPayload.tran_id ||
            null,
          gatewayApprovalCode: gatewayPayload.verify_key || null,
          gatewayResponse: gatewayPayload,
          paidAt: gatewayPayload.validated_on
            ? new Date(gatewayPayload.validated_on)
            : new Date(),
        },
      });

      await tx.paymentGatewayLog.create({
        data: {
          paymentId: existingPayment.id,
          gateway: PaymentGateway.SSLCOMMERZ,
          event: "payment.confirm.success",
          payload: gatewayPayload,
          response: {
            message:
              "Payment confirmed and status updated to PAID successfully",
          },
        },
      });

      return payment;
    });

    // 5. Publish payment success event directly to Event Bus
    if (updatedPayment && updatedPayment.orderId) {
      try {
        await this.eventBus.publish("PAYMENT_CONFIRMED_FROM_PAYMENT_SERVICE", {
          orderId: updatedPayment.orderId,
          status: "CONFIRMED",
          paymentStatus:"PAID",
          note:"Confirm payment by SSL"
        });

        logger.info(
          { orderId: updatedPayment.orderId },
          "Payment confirmed event published successfully 🚀",
        );
      } catch (pubError: any) {
        logger.error(
          { error: pubError.message },
          "Failed to publish payment confirmed event! ❌",
        );
      }
    }
    return updatedPayment;
  }
}
