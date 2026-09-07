import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { CartService } from "./cart.service";

export class CartController extends BaseController {
  private service: CartService;

  constructor() {
    super();
    this.service = new CartService();
  }

  reserveItem = this.asyncHandler(async (req: Request, res: Response) => {
    const { userId, productId, quantity } = req.body;

    // Simple payload validation
    if (!userId || !productId || !quantity) {
      return this.errorResponse(res, "Missing required fields", 400);
    }

    const result = await this.service.reserveItem(
      userId,
      productId,
      Number(quantity),
    );

    this.successResponse(res, result, 200);
  });
}
