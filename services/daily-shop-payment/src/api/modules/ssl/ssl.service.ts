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
      return await this.repository.processPaymentConfirmation(
        transactionId,
        gatewayPayload,
      );
    } catch (error) {
      this._handleError(error, "confirmPayment", { transactionId });
      throw error;
    }
  }
}
