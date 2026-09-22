import { BaseRoutes } from "../../../core/base/base.routes";
import { PaymentController } from "./payment.controller";
import { PaymentValidators } from "./payment.validator";

export class PaymentRoutes extends BaseRoutes<PaymentController> {
  constructor() {
    super(new PaymentController());
  }

  protected registerRoutes(): void {
    this.router.post(
      "/initiate/:orderId",
      this.validateService.allow(["gateway"]),
      this.validateRequest(PaymentValidators.initiatePayment),
      this.controller.initiatePayment,
    );
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(PaymentValidators.listPayment),
      this.controller.getAllPayments,
    );

    this.router.get(
      "/:id",
      this.validateService.allow(["gateway", "order"]),
      this.validateRequest(PaymentValidators.getByIdPayment),
      this.controller.getPaymentById,
    );
  }
}
