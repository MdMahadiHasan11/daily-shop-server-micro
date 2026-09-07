import { BaseRoutes } from "../../../core/base/base.routes";
import { CartController } from "./cart.controller";

export class CartRoutes extends BaseRoutes<CartController> {
  constructor() {
    super(new CartController());
  }

  protected registerRoutes(): void {
    this.router.post(
      "/add",
      //   this.validateRequest(AuthValidators.login),
      this.controller.reserveItem,
    );
  }
}
