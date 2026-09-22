import { PaymentGateway, PaymentStatus } from "@prisma/client";
import { BaseRepository } from "../../../core/base/base.repository";
import { AppError } from "../../../core/errors/errors";
import { SSLCommerzService } from "../../../core/services/ssl/ssl.service";
import { Utils } from "../../utils/payment.utils";
import { InitiatePaymentInput } from "./payment.validator";

export class PaymentRepository extends BaseRepository<"payment"> {
  constructor() {
    super("payment");
  }

  async OrderCheck(orderId: string) {
    try {
      const response = await this.service.get("order", `/${orderId}`);
      const order = response.data;
      return order;
    } catch (err) {
      console.error("Failed to check order from Order Service:", err);
      return null;
    }
  }

  private async generateGatewayUrl(
    payment: any,
    order: any,
    gateway: string,
  ): Promise<string> {
    try {
      if (gateway === PaymentGateway.SSLCOMMERZ) {
        const sslResponse = await SSLCommerzService.sslPaymentInit({
          amount: payment.amount,
          transactionId: payment.paymentNumber,
          orderId: order.id,
          customer: {
            name: order.shippingName,
            email: order.shippingEmail,
            phone: order.shippingPhone,
            address: order.shippingAddress,
            city: order.city,
            postcode: order.postalCode,
            country: order.country,
          },
          productInfo: {
            name: order.items?.[0]?.productName || "E-commerce Order",
            category: "Retail",
          },
        });

        const paymentUrl = sslResponse.GatewayPageURL;
        return paymentUrl;
      } else if (gateway === "BKASH") {
        return `https://checkout.sandbox.bka.sh/v1.2.0-beta/checkout/payment/mock-${payment.paymentNumber}`;
      }
      return "";
    } catch (error: any) {
      console.error(
        "Gateway Integration Error:",
        error?.response?.data || error.message,
      );
      throw new AppError(
        "Payment gateway communication failed",
        500,
        true,
        undefined,
        "GATEWAY_ERROR",
      );
    }
  }

  async createPayment(
    orderId: string,
    userId: string,
    body: InitiatePaymentInput["body"],
  ) {
    const order = await this.OrderCheck(orderId);

    if (!order) {
      throw new AppError(
        "Order not found",
        404,
        true,
        undefined,
        "ORDER_NOT_FOUND",
      );
    }

    if (order && order.status === PaymentStatus.PAID) {
      throw new AppError(
        "This order is already paid!",
        400,
        true,
        undefined,
        "ALREADY_PAID",
      );
    }

    const existingPayment = await this.model.findFirst({
      where: {
        orderId,
        isDeleted: false,
      },
    });

    let payment;

    if (existingPayment) {
      if (existingPayment.status === PaymentStatus.PAID) {
        throw new AppError(
          "This order has already been successfully paid.",
          400,
          true,
          undefined,
          "ORDER_ALREADY_PAID",
        );
      }

      if (existingPayment.status === PaymentStatus.PENDING) {
        payment = await this.model.update({
          where: { id: existingPayment.id },
          data: { gateway: body.paymentGateway },
        });

        await this.prisma.paymentGatewayLog.create({
          data: {
            paymentId: payment.id,
            gateway: body.paymentGateway,
            event: "payment.initiate.updated",
            payload: { orderId, userId, gateway: body.paymentGateway },
            response: { message: "Existing pending payment gateway updated" },
          },
        });
      }
    } else {
      const paymentNumber = Utils.payment.generatePaymentNumber();
      const { totalAmount, paymentMethod } = order;

      payment = await this.create({
        paymentNumber,
        orderId,
        userId,
        amount: totalAmount,
        currency: "BDT",
        method: paymentMethod,
        gateway: body.paymentGateway,
        status: PaymentStatus.PENDING,
        logs: {
          create: {
            gateway: body.paymentGateway,
            event: "payment.initiate.success",
            payload: {
              orderId,
              userId,
              amount: totalAmount,
              gateway: body.paymentGateway,
            },
            response: { message: "Pending payment created successfully" },
          },
        },
      });
    }

    const paymentUrl = await this.generateGatewayUrl(
      payment,
      order,
      body.paymentGateway,
    );

    return { payment, order, paymentUrl };
  }

  async getPaymentById(paymentId: string) {
    return await this.model.findFirst({
      where: {
        id: paymentId,
        isDeleted: false,
      },
      include: {
        refunds: true,
        logs: true,
      },
    });
  }

  async getAllPayments(query: any) {
    return await this.getList(query, {
      include: {
        refunds: true,
      },
    });
  }
}
