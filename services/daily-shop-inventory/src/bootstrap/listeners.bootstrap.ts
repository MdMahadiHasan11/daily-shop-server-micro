import { ProductSyncService } from "../api/modules/product-sync/product-sync.service";
import { StockLevelService } from "../api/modules/stock-level/stock-level.service";
import { eventBus } from "../core/services/event-bus-rabit.service";
import { expiredBatchCron } from "../core/services/expired-batch.cron";
import { redisSubscriberService } from "../core/services/redis-subscriber.service";
import { logger } from "../core/utils/logger.utils";

import { EVENTS } from "./event.constants";

export async function bootstrapListeners(): Promise<void> {
  await redisSubscriberService.start();

  // 1. Product Variant Sync Listener for Inventory Service
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

  // 2. Order Stock Release Listener (Compensation / Failure)
  await eventBus.subscribe(
    "ORDER_STOCK_RELEASE",
    async (event: any) => {
      try {
        const rawData = event?.payload?.payload || event?.payload || event;
        const { orderId, orderNumber, allocationPlan, reason } = rawData;

        if (
          !orderId ||
          !allocationPlan ||
          !Array.isArray(allocationPlan) ||
          allocationPlan.length === 0
        ) {
          logger.error(
            { orderId, reason },
            "Order ID or allocationPlan data is missing/invalid in ORDER_STOCK_RELEASE event payload!",
          );
          return;
        }

        const stockLevelService = new StockLevelService();

        // Execute service-level stock release logic using direct allocation plan
        await stockLevelService.releaseStockForOrder({
          orderId,
          orderNumber,
          allocationPlan,
        });

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

  // 3. Order Payment Timeout Listener (Delayed Event)
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

        const stockLevelService = new StockLevelService();

        // Release the reserved stock because the payment window expired
        await stockLevelService.releaseStockForOrder({
          orderId,
          orderNumber,
          allocationPlan,
        });

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

  // 4. Order Confirmed / Successful Payment Listener
  await eventBus.subscribe(
    "ORDER_CONFIRMED",
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
            "Order ID or allocationPlan data is missing/invalid in ORDER_CONFIRMED event payload!",
          );
          return;
        }

        const stockLevelService = new StockLevelService();

        // Permanently deduct the reserved stock using allocation plan
        await stockLevelService.deductStockPermanently({
          orderId,
          orderNumber,
          allocationPlan,
        });

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