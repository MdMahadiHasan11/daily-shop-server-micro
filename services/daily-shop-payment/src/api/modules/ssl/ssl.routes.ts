import { BaseRoutes } from "../../../core/base/base.routes";
import { SSLController } from "./ssl.controller";

export class SSLRoutes extends BaseRoutes<SSLController> {
  constructor() {
    super(new SSLController());
  }

  protected registerRoutes(): void {
    this.router.post("/success", this.controller.sslSuccess);
    // this.router.post("/fail", this.controller.initiatePayment);
    // this.router.post("/cancel", this.controller.initiatePayment);
    // this.router.post("/ipn", this.controller.initiatePayment);
  }
}
