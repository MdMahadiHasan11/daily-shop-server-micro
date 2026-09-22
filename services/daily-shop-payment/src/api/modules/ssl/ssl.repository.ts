import { PaymentGateway, PaymentStatus } from "@prisma/client";
import axios from "axios";
import { BaseRepository } from "../../../core/base/base.repository";
import { env } from "../../../core/config/env.config";
import { AppError } from "../../../core/errors/errors";

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
      console.error("Failed to fetch order from Order Service:", err);
      return null;
    }
  }

  // Update order status in Order Microservice
  async updateOrderInService(
    orderId: string,
    status: string,
    transactionId: string,
  ) {
    try {
      const orderServiceUrl = env.ORDER_SERVICE_URL;
      await axios.patch(
        `${orderServiceUrl}/orders/update-status`,
        {
          orderId,
          status,
          transactionId,
        },
        {
          headers: {
            "x-internal-secret": env.PAYMENT_INTERNAL_SECRET,
          },
        },
      );
    } catch (error: any) {
      console.error(
        `Failed to update order status in Order Service: ${error.message}`,
      );
      // TODO: Implement message queue (RabbitMQ) or event fallback if microservice call fails
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

    // 5. Communicate with the separate Order Microservice to update the order status
    const orderId = existingPayment.orderId;
    // if (orderId) {
    //   const order = await this.getOrderFromService(orderId);
    //   if (order) {
    //     await this.updateOrderInService(orderId, "PAID", transactionId);
    //   }
    // }


     const { orderId, status, note, userId } = rawData;
    // 2. Trigger event ONLY when transitioning from PENDING to CONFIRMED
    if (previousStatus === "PENDING" && status === "CONFIRMED") {
      await this.eventBus.publish(
        "PAYMENT_CONFIRMED_FOR_ORDER_SERVICE",
        payload,
      );
    }

    // TODO: Add extra notification triggers, wallet credits, or webhook dispatches if required

    return updatedPayment;
  }
}
