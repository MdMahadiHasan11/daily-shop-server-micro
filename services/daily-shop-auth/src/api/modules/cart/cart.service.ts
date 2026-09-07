import { BaseService } from "../../../core/base/base.service";

export class CartService extends BaseService {
  constructor() {
    super();
    this.serviceName = "CartService";
  }

  async reserveItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<{ success: boolean; message: string }> {
    // Atomic database update
    // await this.db.product.update({
    //   where: { id: productId },
    //   data: { stock: { decrement: quantity } },
    // });

    const reservationKey = `cart:reservation:${productId}:${quantity}:${userId}`;

    const ttlSeconds = 5;
    await this.cache.set(
      reservationKey,
      { userId, productId, quantity, reservedAt: new Date() },
      { ttl: ttlSeconds },
    );

    return {
      success: true,
      message: `Reserved ${quantity} item(s) for ${ttlSeconds}s`,
    };
  }

  /**
   * Expire cart reservation and restore stock
   */
  async restoreStockOnExpiration(
    productId: string,
    quantity: number,
  ): Promise<void> {
    try {
      console.log(`Restoring stock for product [${productId}]`);
      // await this.db.product.update({
      //   where: { id: productId },
      //   data: {
      //     stock: { increment: quantity },
      //   },
      // });
    } catch (error) {
      this._handleError(error, "restoreStockOnExpiration", {
        productId,
        quantity,
      });
      throw error;
    }
  }
}
