import { ProductSyncService } from "../api/modules/product-sync/product-sync.service";
import { StockLevelService } from "../api/modules/stock-level/stock-level.service";
import { eventBus } from "../core/services/event-bus-rabit.service";
import { expiredBatchCron } from "../core/services/expired-batch.cron";
import { redisSubscriberService } from "../core/services/redis-subscriber.service";
import { redisService } from "../core/services/redis.service";
import { logger } from "../core/utils/logger.utils";

import { EVENTS } from "./event.constants";

export async function bootstrapListeners(): Promise<void> {
  const cache = redisService;

  // 1. Register OTP & Forgot Password Expiration Handlers (Other Redis keys if needed)
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

  // 2. Product Variant Sync Listener for Inventory Service
  await eventBus.subscribe(
    EVENTS.AFTER_PRODUCT_CREATE_NEED_INVENTORY,
    async (event: any) => {
      try {
        const rawData = event?.payload?.payload || event?.payload || event;
        const variants = rawData?.variants;

        if (!variants || !Array.isArray(variants) || variants.length === 0) {
          logger.error(
            "Variants data is missing or invalid in product creation event payload!",
          );
          return;
        }

        const productSyncService = new ProductSyncService();

        for (const variant of variants) {
          await productSyncService.syncProductVariant({
            id: variant.id,
            productId: variant.productId,
            sku: variant.sku,
            barcode: variant.barcode,
            name: variant.name,
            price: variant.price,
            discountPrice: variant.discountPrice,
            costPrice: variant.costPrice,
            unit: variant.unit,
            weightValue: variant.weightValue,
            attributes: variant.attributes,
            images: variant.images,
            isDefault: variant.isDefault,
          });
        }

        logger.info(
          { productId: rawData?.productId, totalVariants: variants.length },
          "All product variants synced successfully via event queue 🚀",
        );
      } catch (error: any) {
        logger.error(
          { error: error?.message },
          "Failed to sync product variants from event queue ❌",
        );
        throw error;
      }
    },
    "inventory_service_product_group",
  );

  // 3. New Order Stock Release Listener (Handles rollbacks when order creation fails in checkout)
  await eventBus.subscribe(
    "ORDER_STOCK_RELEASE",
    async (event: any) => {
      try {
        const rawData = event?.payload?.payload || event?.payload || event;
        const {
          orderId,
          orderNumber,
          allocationPlan: eventAllocationPlan,
          reason,
        } = rawData;

        if (!orderId) {
          logger.error(
            "Order ID is missing in ORDER_STOCK_RELEASE event payload!",
          );
          return;
        }

        const cacheKey = `order:compensation:${orderId}`;
        const stockLevelService = new StockLevelService();

        // Retrieve the exact stock payload from Redis cache first
        let payloadToRelease = await cache.get<{ allocationPlan: any }>(
          cacheKey,
        );

        const allocationPlan =
          payloadToRelease?.allocationPlan || eventAllocationPlan;

        if (
          !allocationPlan ||
          !Array.isArray(allocationPlan) ||
          allocationPlan.length === 0
        ) {
          logger.error(
            { orderId, reason },
            "Allocation plan data is missing or invalid for stock release!",
          );
          return;
        }

        // Execute service-level stock release logic
        await stockLevelService.releaseStockForOrder({
          orderId,
          orderNumber,
          allocationPlan,
        });

        // Delete cache immediately
        await cache.delete(cacheKey);

        logger.info(
          { orderId, orderNumber, reason },
          "Reserved stock successfully released due to order creation failure 🔓📦",
        );
      } catch (error: any) {
        logger.error(
          { error: error?.message, eventPayload: event },
          "Failed to release stock for the failed order from event queue ❌",
        );
        throw error;
      }
    },
    "inventory_service_order_release_group",
  );

  // 4. Order Payment Timeout Listener (Triggered automatically via Delayed Event after timeout)
  await eventBus.subscribe(
    "ORDER_PAYMENT_TIMEOUT",
    async (event: any) => {
      try {
        const rawData = event?.payload?.payload || event?.payload || event;
        const { orderId, orderNumber, allocationPlan } = rawData;

        if (
          !orderId ||
          !allocationPlan ||
          !Array.isArray(allocationPlan) ||
          allocationPlan.length === 0
        ) {
          logger.error(
            "Order ID or allocationPlan data is missing/invalid in ORDER_PAYMENT_TIMEOUT event payload!",
          );
          return;
        }

        const cacheKey = `order:compensation:${orderId}`;
        const stockLevelService = new StockLevelService();

        // Release the reserved stock because the payment window expired
        await stockLevelService.releaseStockForOrder({
          orderId,
          orderNumber,
          allocationPlan,
        });

        // Clear compensation cache if it still exists
        await cache.delete(cacheKey);

        logger.info(
          { orderId, orderNumber },
          "Reserved stock successfully released due to payment timeout/failure (delayed event) 🔓⏳",
        );
      } catch (error: any) {
        logger.error(
          { error: error?.message, eventPayload: event },
          "Failed to release stock for the timed-out order from event queue ❌",
        );
        throw error;
      }
    },
    "inventory_service_order_timeout_group",
  );

  // 5. Order Confirmed / Successful Payment Listener
  await eventBus.subscribe(
    "ORDER_CONFIRMED",
    async (event: any) => {
      try {
        const rawData = event?.payload?.payload || event?.payload || event;
        const { orderId, orderNumber, items } = rawData;

        if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
          logger.error(
            "Order ID or items data is missing/invalid event payload!",
          );
          return;
        }

        const cacheKey = `order:compensation:${orderId}`;
        const stockLevelService = new StockLevelService();

        // Clear the Redis compensation cache immediately since payment is successful
        await cache.delete(cacheKey);

        // Permanently deduct the reserved stock since payment is successful
        await stockLevelService.deductStockPermanently({
          orderId: orderId,
          items: items,
        });

        logger.info(
          { orderId, orderNumber },
          "Reserved stock successfully deducted permanently and compensation cache cleared due to successful payment 💳📦",
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
