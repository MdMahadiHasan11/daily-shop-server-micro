import { Request, Response } from "express";
import { BaseController } from "../../../core/base/base.controller";
import { PaymentService } from "./payment.service";
import {
  IdPaymentInput,
  InitiatePaymentInput,
  ListPaymentQuery,
} from "./payment.validator";

export class PaymentController extends BaseController {
  private service: PaymentService;

  constructor() {
    super();
    this.service = new PaymentService();
  }

  initiatePayment = this.asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.validatedBody.params
      .orderId as InitiatePaymentInput["params"]["orderId"];
    const body = req.validatedBody.body as InitiatePaymentInput["body"];

    const metaData = this.getReqMetadata(req);
    const userId = metaData.id as string;

    const result = await this.service.initiatePaymentService(
      orderId,
      body,
      userId as string,
    );

    return this.successResponse(res, result, 200, {
      message: "Pending payment create successfully",
    });
  });

  getPaymentById = this.asyncHandler(async (req: Request, res: Response) => {
    const paymentId = req.validatedBody.params
      .id as IdPaymentInput["params"]["id"];

    const payment = await this.service.getPaymentDetails(paymentId);

    return this.successResponse(res, payment, 200, {
      message: "Payment retrieved successfully",
    });
  });

  getAllPayments = this.asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedBody.query as ListPaymentQuery["query"];
    const payments = await this.service.getAllPayments(query);

    return this.successResponse(res, payments.data, 200, {
      message: "Payments retrieved successfully",
      pagination: payments.pagination,
    });
  });
}
