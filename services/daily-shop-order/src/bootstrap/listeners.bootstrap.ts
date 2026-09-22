import { OrderService } from "../api/modules/order/order.service";
import { eventBus } from "../core/services/event-bus-rabit.service";
import { redisSubscriberService } from "../core/services/redis-subscriber.service";
import { logger } from "../core/utils/logger.utils";

interface LoginInitiate {
  name?: string;
  email?: string;
  phone?: string;
  otp: string;
  expiryMinutes: number;
}

export async function bootstrapListeners(): Promise<void> {
  await eventBus.subscribe(
    "PAYMENT_CONFIRMED_FOR_ORDER_SERVICE",
    async (event: any) => {
      try {
        const rawData = event?.payload?.payload || event?.payload || event;
        const { orderId, userId, status, note, paymentStatus } = rawData;
        const payload = {
          orderId,
          userId,
          status,
          note,
          paymentStatus,
        };
        if (!orderId || !status) {
          logger.error("Order ID  is missing/invalid  event payload!");
          return;
        }

        const orderService = new OrderService();

       
        await orderService.updateOrderStatus(
          orderId,
          status,
          note,
          userId as string,
          paymentStatus,
        );

        logger.info(
          { orderId, userId },
          "After Successful Payment Reserved stock successfully deducted permanently due to successful payment 💳📦",
        );
      } catch (error: any) {
        logger.error(
          { error: error?.message, eventPayload: event },
          "Failed to deduct stock permanently for the paid order from event queue ❌",
        );
        throw error;
      }
    },
    "inventory_service_payment_success_group_call_from_payment_service",
  );

  await redisSubscriberService.start();
}
