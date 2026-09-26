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
      const response = await this.service.post("product", "/variants/bulk", {
        variantIds,
      });
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

  async getCampaignProductDetails(campaignId: string): Promise<any[]> {
    try {
      const response = await this.service.post("campaign", "/variants/bulk", {
        campaignId,
      });
      return response.data;
    } catch (err) {
      console.error(
        "Failed to fetch variant details from Product Service:",
        err,
      );
      return [];
    }
  }

  async addToCart(
    userId: string,
    productVariantId: string,
    quantity: number,
    campaignId?: string,
  ) {
    return await this.transaction(async (tx) => {
      let cart = await tx.cart.findUnique({ where: { userId } });

      if (!cart) {
        cart = await tx.cart.create({ data: { userId } });
      }

      let finalCampaignId: string | null = null;
      let discountType: string | null = null;
      let discountValue: number | null = null;

      // 2. Validate campaign and calculate discount on the backend if campaignId is provided
      if (campaignId) {
        const campaignProduct =
          await this.getCampaignProductDetails(campaignId);

        const now = new Date();
        if (
          campaignProduct &&
          campaignProduct.campaign.isActive &&
          !campaignProduct.campaign.isDeleted &&
          now >= new Date(campaignProduct.campaign.startDate) &&
          now <= new Date(campaignProduct.campaign.endDate)
        ) {
          finalCampaignId = campaignId;
          discountType = campaignProduct.discountType;
          discountValue = campaignProduct.discountValue;
        } else {
          throw new AppError(
            "Campaign is invalid or expired",
            400,
            true,
            undefined,
            "INVALID_CAMPAIGN",
          );
        }
      }

      // 3. Check for existing cart item
      // Note: Based on your @@unique([cartId, productVariantId]) constraint,
      // if you want normal items and campaign items to coexist for the same variant,
      // make sure to adjust your Prisma schema unique constraint to @@unique([cartId, productVariantId, campaignId]) if needed.
      const existingItem = await tx.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productVariantId,
          campaignId: finalCampaignId,
        },
      });

      const currentCartQuantity = existingItem ? existingItem.quantity : 0;
      const totalRequestedQuantity = currentCartQuantity + quantity;

      // 4. Check stock availability (considering campaign stock limits if applicable)
      const stockAvailable = await this.checkStockAvailability(
        productVariantId,
        finalCampaignId,
      );

      if (stockAvailable < totalRequestedQuantity) {
        throw new AppError(
          "Requested quantity exceeds available stock",
          400,
          true,
          undefined,
          "OUT_OF_STOCK",
        );
      }

      // 5. Update or create cart item with backend-validated campaign data
      if (existingItem) {
        return await tx.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: totalRequestedQuantity,
            discountType,
            discountValue,
          },
        });
      } else {
        return await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productVariantId,
            quantity,
            campaignId: finalCampaignId,
            discountType,
            discountValue,
          },
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
