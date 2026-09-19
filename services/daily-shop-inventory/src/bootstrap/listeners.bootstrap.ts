import { ProductSyncService } from "../api/modules/product-sync/product-sync.service";
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
        // Safe data extraction from RabbitMQ event payload
        const rawData = event?.payload?.payload || event?.payload || event;
        const variants = rawData?.variants;

        if (!variants || !Array.isArray(variants) || variants.length === 0) {
          logger.error(
            "Variants data is missing or invalid in product creation event payload!",
          );
          return;
        }

        const productSyncService = new ProductSyncService();

        // Loop through each variant and sync with inventory/sync repository
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
      }
    },
    "inventory_service_product_group", // Consumer group name
  );
}
