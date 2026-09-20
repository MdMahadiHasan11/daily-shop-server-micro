import { BaseRoutes } from "../../../core/base/base.routes";
import { OrderController } from "./order.controller";
import { OrderValidators } from "./order.validator";

export class OrderRoutes extends BaseRoutes<OrderController> {
  constructor() {
    super(new OrderController());
  }

  protected registerRoutes(): void {
    this.router.get(
      "/",
      this.validateService.allow(["gateway"]),
      this.validateRequest(OrderValidators.listOrders),
      this.controller.getAllOrders,
    );

    this.router.get(
      "/:id",
      this.validateService.allow(["gateway", "inventory"]),
      this.controller.getOrderById,
    );

    this.router.post(
      "/",
      this.validateService.allow(["gateway", "cart", "user"]),
      this.validateRequest(OrderValidators.createOrder),
      this.controller.createOrder,
    );

    this.router.patch(
      "/:id/status",
      this.validateService.allow(["gateway"]),
      this.validateRequest(OrderValidators.updateOrderStatus),
      this.controller.updateOrderStatus,
    );
  }
}
