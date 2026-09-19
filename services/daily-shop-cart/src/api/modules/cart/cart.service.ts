import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { CartRepository } from "./cart.repository";

export class CartService extends BaseService {
  private readonly repository: CartRepository;

  constructor() {
    super();
    this.repository = new CartRepository();
    this.serviceName = "CartService";
  }

  async getMyCart(userId: string): Promise<any> {
    try {
      const cart = await this.repository.getCartByUserId(userId);

      if (!cart || cart.items.length === 0) {
        return { cartId: null, items: [], totalItems: 0 };
      }

      const variantIds = cart.items.map((item) => item.productVariantId);

      const variants = await this.repository.getVariantDetails(variantIds);

      let variantDetailsMap = new Map();
      variants.forEach((v: any) => variantDetailsMap.set(v.id, v));

      const enrichedItems = cart.items.map((item) => {
        const productInfo =
          variantDetailsMap.get(item.productVariantId) || null;
        return {
          id: item.id,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          productDetails: productInfo,
        };
      });

      return {
        cartId: cart.id,
        userId: cart.userId,
        items: enrichedItems,
        totalItems: enrichedItems.reduce((acc, curr) => acc + curr.quantity, 0),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this._handleError(error, "getMyCart", { userId });
      throw error;
    }
  }

  // Add to Cart
  async addToCart(
    userId: string,
    data: { productVariantId: string; quantity: number },
  ): Promise<any> {
    try {
      const { productVariantId, quantity } = data;

      const result = await this.repository.addToCart(
        userId,
        productVariantId,
        quantity,
      );
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this._handleError(error, "addToCart", { userId, data });
      throw error;
    }
  }

  // Update Item Quantity
  async updateItemQuantity(
    userId: string,
    data: { productVariantId: string; quantity: number },
  ): Promise<any> {
    try {
      const { productVariantId, quantity } = data;

      const result = await this.repository.updateItemQuantity(
        userId,
        productVariantId,
        quantity,
      );
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this._handleError(error, "updateItemQuantity", { userId, data });
      throw error;
    }
  }

  // Remove Single Item from Cart
  async removeItem(userId: string, productVariantId: string): Promise<any> {
    try {
      const result = await this.repository.removeItem(userId, productVariantId);
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this._handleError(error, "removeItem", { userId, productVariantId });
      throw error;
    }
  }

  // Clear Cart
  async clearCart(userId: string): Promise<any> {
    try {
      return await this.repository.clearCart(userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this._handleError(error, "clearCart", { userId });
      throw error;
    }
  }
}
