import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { IMetaData } from "../../../core/utils/request-metadata";
import { CartService } from "./cart.service";

export class CartController extends BaseController {
  private service: CartService;

  constructor() {
    super();
    this.service = new CartService();
  }

  getMyCart = this.asyncHandler(async (req: Request, res: Response) => {
    const metaData = this.getReqMetadata(req) as IMetaData;
    const userId = metaData.id as string;
    const result = await this.service.getMyCart(userId);
    return this.successResponse(res, result, 200);
  });

  addToCart = this.asyncHandler(async (req: Request, res: Response) => {
    const metaData = this.getReqMetadata(req) as IMetaData;
    const userId = metaData.id as string;
    const { productVariantId, quantity } = req.validatedBody.body;

    const result = await this.service.addToCart(userId, {
      productVariantId,
      quantity,
    });
    return this.successResponse(res, result, 200, {
      message: "Product added to cart successfully",
    });
  });

  updateItemQuantity = this.asyncHandler(
    async (req: Request, res: Response) => {
      const metaData = this.getReqMetadata(req) as IMetaData;
      const userId = metaData.id as string;
      const { productVariantId, quantity } = req.validatedBody.body;

      const result = await this.service.updateItemQuantity(userId, {
        productVariantId,
        quantity,
      });
      return this.successResponse(res, result, 200, {
        message: "Cart item quantity updated successfully",
      });
    },
  );

  removeItem = this.asyncHandler(async (req: Request, res: Response) => {
    const metaData = this.getReqMetadata(req) as IMetaData;
    const userId = metaData.id as string;
    const { productVariantId } = req.validatedBody.params;

    const result = await this.service.removeItem(userId, productVariantId);
    return this.successResponse(res, result, 200, {
      message: "Item removed from cart successfully",
    });
  });

  clearCart = this.asyncHandler(async (req: Request, res: Response) => {
    const metaData = this.getReqMetadata(req) as IMetaData;

    const result = await this.service.clearCart(metaData.id as string);
    return this.successResponse(res, result, 200, {
      message: "Cart cleared successfully",
    });
  });
}
