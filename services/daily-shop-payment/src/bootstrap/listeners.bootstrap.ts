import { eventBus } from "../core/services/event-bus-rabit.service";
import { expiredBatchCron } from "../core/services/expired-batch.cron";
import { redisSubscriberService } from "../core/services/redis-subscriber.service";
import { logger } from "../core/utils/logger.utils";

export async function bootstrapListeners(): Promise<void> {
  // 1. Register OTP Expiration Event Handler
  redisSubscriberService.onKeyExpired("otp", (fullKey, keyParts) => {
    const identifier = keyParts;
    logger.info(`redis key expired: ${fullKey}`);
  });

  redisSubscriberService.onKeyExpired("forgot", (fullKey, keyParts) => {
    const email = keyParts[1];
    logger.info(
      `[Auth Listener] Password reset token/OTP expired for email: ${email}`,
    );
  });

  await redisSubscriberService.start();

  await eventBus.subscribe(
    "ORDER_CONFIRMED",
    async (event: any) => {
      try {
        const rawData = event?.payload?.payload || event?.payload || event;
        const { orderId, orderNumber, items } = rawData;

        if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
          logger.error(
            "Order ID or items data is missing/invalid  event payload!",
          );
          return;
        }

        // const stockLevelService = new StockLevelService();

        // await stockLevelService.deductStockPermanently({
        //   orderId: orderId,
        //   items: items,
        // });

        logger.info(
          { orderId, orderNumber },
          "Reserved stock successfully deducted permanently due to successful payment 💳📦",
        );
      } catch (error: any) {
        logger.error(
          { error: error?.message, eventPayload: event },
          "Failed to deduct stock permanently for the paid order from event queue ❌",
        );
        throw error;
      }
    },
    "inventory_service_payment_success_group",
  );

  expiredBatchCron.start();
  logger.info(
    "🚀 All background listeners and cron jobs initialized successfully!",
  );
}
