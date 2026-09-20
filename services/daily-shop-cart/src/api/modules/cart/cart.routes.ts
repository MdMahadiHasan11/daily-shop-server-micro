import { BaseRoutes } from "../../../core/base/base.routes";
import { CartController } from "./cart.controller";
import { CartValidators } from "./cart.validator";

export class CartRoutes extends BaseRoutes<CartController> {
  constructor() {
    super(new CartController());
  }

  protected registerRoutes(): void {
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.controller.getMyCart,
    );

    this.router.post(
      "/add",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CartValidators.addToCart),
      this.controller.addToCart,
    );

    this.router.patch(
      "/item",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CartValidators.updateItemQuantity),
      this.controller.updateItemQuantity,
    );

    this.router.delete(
      "/item/:productVariantId",
      this.validateService.allow(["gateway"]),
      this.validateRequest(CartValidators.removeItem),
      this.controller.removeItem,
    );

    this.router.delete(
      "/clear",
      this.validateService.allow(["gateway"]),
      this.controller.clearCart,
    );
  }
}
