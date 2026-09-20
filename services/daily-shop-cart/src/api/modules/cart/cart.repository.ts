import { BaseRepository } from "../../../core/base/base.repository";
import { AppError } from "../../../core/errors/errors";

export class CartRepository extends BaseRepository<"cart"> {
  constructor() {
    super("cart");
  }

  async getCartByUserId(userId: string) {
    return await this.model.findUnique({
      where: { userId, isDeleted: false },
      include: {
        items: true,
      },
    });
  }

  async getVariantDetails(variantIds: string[]): Promise<any[]> {
    try {
      const response = await this.service.post(
        "product",
        "/product/variants/bulk",
        { variantIds },
      );
      return response.data || [];
    } catch (err) {
      console.error(
        "Failed to fetch variant details from Product Service:",
        err,
      );
      return [];
    }
  }

  async checkStockAvailability(productVariantId: string): Promise<number> {
    try {
      const response = await this.service.get(
        "inventory",
        `/stock-level/stock/${productVariantId}?fields=minimal`,
      );

      const availableStock = response.data?.availableStock || 0;
      return availableStock;
    } catch (err) {
      console.error("Failed to check stock from Inventory Service:", err);
      return 0;
    }
  }

  async addToCart(userId: string, productVariantId: string, quantity: number) {
    return await this.transaction(async (tx) => {
      let cart = await tx.cart.findUnique({ where: { userId } });

      if (!cart) {
        cart = await tx.cart.create({ data: { userId } });
      }

      const existingItem = await tx.cartItem.findUnique({
        where: {
          cartId_productVariantId: { cartId: cart.id, productVariantId },
        },
      });

      const currentCartQuantity = existingItem ? existingItem.quantity : 0;
      const totalRequestedQuantity = currentCartQuantity + quantity;

      const stockAvailable =
        await this.checkStockAvailability(productVariantId);

      if (stockAvailable < totalRequestedQuantity) {
        throw new AppError(
          "Requested quantity exceeds available stock",
          400,
          true,
          undefined,
          "OUT_OF_STOCK",
        );
      }

      if (existingItem) {
        return await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: totalRequestedQuantity },
        });
      } else {
        return await tx.cartItem.create({
          data: { cartId: cart.id, productVariantId, quantity },
        });
      }
    });
  }

  async updateItemQuantity(
    userId: string,
    productVariantId: string,
    quantity: number,
  ) {
    const cart = await this.getCartByUserId(userId);
    if (!cart) {
      throw new AppError(
        "Cart not found",
        404,
        true,
        undefined,
        "CART_NOT_FOUND",
      );
    }

    return await this.transaction(async (tx) => {
      const existingItem = await tx.cartItem.findUnique({
        where: {
          cartId_productVariantId: { cartId: cart.id, productVariantId },
        },
      });

      if (!existingItem) {
        throw new AppError(
          "Cart item not found",
          404,
          true,
          undefined,
          "CART_ITEM_NOT_FOUND",
        );
      }

      // If quantity is 0 or less, remove the item entirely
      if (quantity <= 0) {
        await tx.cartItem.delete({ where: { id: existingItem.id } });
        return { message: "Item removed from cart successfully" };
      }

      // Check stock availability inside the transaction wrapper (Comparing numbers correctly)
      const stockAvailable =
        await this.checkStockAvailability(productVariantId);

      if (stockAvailable < quantity) {
        throw new AppError(
          "Requested quantity exceeds available stock",
          400,
          true,
          undefined,
          "OUT_OF_STOCK",
        );
      }

      // Update the cart item quantity safely
      return await tx.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity },
      });
    });
  }

  async removeItem(userId: string, productVariantId: string) {
    const cart = await this.getCartByUserId(userId);
    if (!cart) {
      throw new AppError(
        "Cart not found",
        404,
        true,
        undefined,
        "CART_NOT_FOUND",
      );
    }

    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_productVariantId: { cartId: cart.id, productVariantId } },
    });

    if (!existingItem) {
      throw new AppError(
        "Cart item not found",
        404,
        true,
        undefined,
        "CART_ITEM_NOT_FOUND",
      );
    }

    await this.prisma.cartItem.delete({
      where: { id: existingItem.id },
    });

    return { message: "Item removed successfully" };
  }

  async clearCart(userId: string) {
    const cart = await this.model.findUnique({
      where: { userId, isDeleted: false },
    });

    if (!cart) {
      throw new AppError(
        "Cart not found",
        404,
        true,
        undefined,
        "CART_NOT_FOUND",
      );
    }

    return await this.transaction(async (tx) => {
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
      return { message: "Cart cleared successfully" };
    });
  }
}
