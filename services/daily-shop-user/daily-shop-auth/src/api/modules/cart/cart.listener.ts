// cart.listener.ts
import { redisSubscriberService } from "../../../core/services/redis-subscriber.service";
import { logger } from "../../../core/utils/logger.utils";
import { CartService } from "./cart.service";

const cartService = new CartService();

export class CartExpirationListener {
  public static register(): void {
    redisSubscriberService.onKeyExpired("cart", async (fullKey, keyParts) => {
      const [, action, productId, quantityStr] = keyParts;

      console.log("------------------------------xx---------------", keyParts);

      if (action === "reservation" && productId && quantityStr) {
        const quantity = parseInt(quantityStr, 10);

        try {
          // ✅ Object ধরে কল করা হলো
          await cartService.restoreStockOnExpiration(productId, quantity);
        } catch (error) {
          logger.error(
            { error, productId },
            `[CartListener] Failed to restore stock for product [${productId}]`,
          );
        }
      }
    });
  }
}
