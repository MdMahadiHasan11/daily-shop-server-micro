import { PaginationResult } from "../../../common/interfaces";
import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { PaymentRepository } from "./payment.repository";
import { InitiatePaymentInput } from "./payment.validator";

export class PaymentService extends BaseService {
  private readonly repository: PaymentRepository;

  constructor() {
    super();
    this.repository = new PaymentRepository();
    this.serviceName = "PaymentService";
  }

  async initiatePaymentService(
    orderId: string,
    body: InitiatePaymentInput["body"],
    userId: string,
  ): Promise<any> {
    try {
      const { payment, order, paymentUrl } =
        await this.repository.createPayment(orderId, userId, body);

      return { payment, order, paymentUrl };
    } catch (error) {
      this._handleError(error, "initiatePaymentService", { orderId });
      throw error;
    }
  }

  async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      const payment = await this.repository.getPaymentById(paymentId);
      if (!payment) {
        throw new AppError(
          "Payment not found",
          404,
          true,
          undefined,
          "PAYMENT_NOT_FOUND",
        );
      }
      return payment;
    } catch (error) {
      this._handleError(error, "getPaymentDetails", { paymentId });
      throw error;
    }
  }

  async getAllPayments(query: any): Promise<PaginationResult<any>> {
    try {
      return await this.repository.getAllPayments(query);
    } catch (error) {
      this._handleError(error, "getAllPayments", { query });
      throw error;
    }
  }
}
