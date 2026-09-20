import { ProductSyncService } from "../api/modules/product-sync/product-sync.service";
import { StockLevelService } from "../api/modules/stock-level/stock-level.service";

import { eventBus } from "../core/services/event-bus-rabit.service";
import { redisSubscriberService } from "../core/services/redis-subscriber.service";
import { logger } from "../core/utils/logger.utils";

import { EVENTS } from "./event.constants";

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

  // 3. Order Stock Hold Listener for Inventory Service (Retry & DLQ Enabled)
  await eventBus.subscribe(
    "ORDER_STOCK_HOLD",
    async (event: any) => {
      try {
        const rawData = event?.payload?.payload || event?.payload || event;
        const { orderId, orderNumber, items } = rawData;

        if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
          logger.error(
            "Order ID or items data is missing/invalid in ORDER_STOCK_HOLD event payload!",
          );
          return;
        }

        const stockLevelService = new StockLevelService();
        await stockLevelService.holdStockForOrder({
          orderId: orderId,
          items: items,
        });

        logger.info(
          { orderId, orderNumber, Items: items },
          "Stock successfully held/reserved for online order 🛒🔒",
        );
      } catch (error: any) {
        logger.error(
          { error: error?.message, eventPayload: event },
          "Failed to hold stock for the order from event queue ❌",
        );
        throw error;
      }
    },
    "inventory_service_order_stock_hold_group",
  );

  // 4. Order Payment Timeout / Failed Listener for Inventory Service (Stock Release)
  await eventBus.subscribe(
    "ORDER_PAYMENT_TIMEOUT",
    async (event: any) => {
      try {
        const rawData = event?.payload?.payload || event?.payload || event;
        const { orderId, orderNumber, items } = rawData;

        if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
          logger.error(
            "Order ID or items data is missing/invalid in ORDER_PAYMENT_TIMEOUT event payload!",
          );
          return;
        }

        // Check in the database via repository/service if the order is already Paid or Approved/Confirmed.
        // If it is already paid or approved, do NOT release the stock because permanent deduction will handle or has handled it.
        /*
        const order = await orderRepository.findById(orderId);
        if (!order || order.paymentStatus === 'PAID' || order.status === 'APPROVED' || order.status === 'CONFIRMED') {
          logger.info(
            { orderId, orderNumber },
            "Order is already paid or approved. Skipping stock release on timeout. 👍",
          );
          return;
        }
        */

        const stockLevelService = new StockLevelService();
        await stockLevelService.releaseStockForOrder({
          orderId: orderId,
          items: items,
        });

        logger.info(
          { orderId, orderNumber },
          "Reserved stock successfully released due to payment timeout/failure 🔓📦",
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

  //  await this.eventBus.publish("ORDER_PAYMENT_SUCCESS", {
  //       orderId: order.id,
  //       orderNumber: order.orderNumber,
  //       items: items,
  //     });
  await eventBus.subscribe(
    "ORDER_PAYMENT_SUCCESS",
    async (event: any) => {
      try {
        const rawData = event?.payload?.payload || event?.payload || event;
        const { orderId, orderNumber, items } = rawData;

        if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
          logger.error(
            "Order ID or items data is missing/invalid in ORDER_PAYMENT_SUCCESS event payload!",
          );
          return;
        }

        const stockLevelService = new StockLevelService();

        // Permanently deduct the reserved stock since payment is successful
        await stockLevelService.deductStockPermanently({
          orderId: orderId,
          items: items,
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
}
