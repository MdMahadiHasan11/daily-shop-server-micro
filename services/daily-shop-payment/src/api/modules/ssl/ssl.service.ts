import { PaymentStatus } from "@prisma/client";
import { BaseService } from "../../../core/base/base.service";
import { SSLRepository } from "./ssl.repository";

export class SSLService extends BaseService {
  private readonly repository: SSLRepository;

  constructor() {
    super();
    this.repository = new SSLRepository();
    this.serviceName = "SSLService";
  }

  async confirmPayment(transactionId: string, gatewayPayload: any) {
    try {
      // Delegate all database checks, updates, transactions, and order service calls to the repository
      const paymentUpdate = await this.repository.processPaymentConfirmation(
        transactionId,
        gatewayPayload,
      );

      const { orderId, userId } = paymentUpdate;
      const payload = {
        orderId,
        userId,
        status: "CONFIRMED",
        note: "Order confirmed  and also payment paid by ssl.",
        paymentStatus: PaymentStatus.PAID,
      };

      await this.eventBus.publish(
        "PAYMENT_CONFIRMED_FOR_ORDER_SERVICE",
        payload,
      );

      return paymentUpdate;
    } catch (error) {
      this._handleError(error, "confirmPayment", { transactionId });
      throw error;
    }
  }
}
