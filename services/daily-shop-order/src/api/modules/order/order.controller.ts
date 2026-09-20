import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { IMetaData } from "../../../core/utils/request-metadata";
import { OrderService } from "./order.service";
import { OrderCreate, OrderListQuery, OrderUpdate } from "./order.validator";

export class OrderController extends BaseController {
  private service: OrderService;

  constructor() {
    super();
    this.service = new OrderService();
  }
  getAllOrders = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody.query as OrderListQuery["query"];
    const result = await this.service.getAllOrders(query);
    return this.successResponse(res, result.data, 200, {
      message: "Get all orders successfully.",
      pagination: result.pagination,
      query,
    });
  });

  getOrderById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.getOrderDetails(id as string);
    return this.successResponse(res, result, 200);
  });

  createOrder = this.asyncHandler(async (req: Request, res: Response) => {
    const metaData = this.getReqMetadata(req) as IMetaData;

    const orderData = req.validatedBody.body as OrderCreate["body"];
    const result = await this.service.createOrder(orderData, metaData);
    return this.successResponse(res, result, 201, {
      message: "Order placed successfully",
    });
  });

  updateOrderStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const id = req.validatedBody.params.id as OrderUpdate["params"]["id"];
    const { status, note } = req.validatedBody.body as OrderUpdate["body"];

    const metaData = this.getReqMetadata(req);
    const userId = metaData.id;

    const result = await this.service.updateOrderStatus(
      id,
      status,
      note,
      userId as string,
    );
    return this.successResponse(res, result, 200, {
      message: "Order status updated successfully",
    });
  });
}
