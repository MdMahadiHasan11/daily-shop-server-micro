import { PaymentStatus } from "@prisma/client";
import { PaginationResult } from "../../../common/interfaces";
import { BaseService } from "../../../core/base/base.service";
import { env } from "../../../core/config/env.config";
import { AppError } from "../../../core/errors/errors";
import { IMetaData } from "../../../core/utils/request-metadata";
import { OrderRepository } from "./order.repository";
import { OrderCreate, OrderListQuery } from "./order.validator";

export class OrderService extends BaseService {
  private readonly repository: OrderRepository;

  constructor() {
    super();
    this.repository = new OrderRepository();
    this.serviceName = "OrderService";
  }

  async getAllOrders(
    query: OrderListQuery["query"],
  ): Promise<PaginationResult<any>> {
    try {
      return await this.repository.getAllOrders(query);
    } catch (error) {
      this._handleError(error, "getAllOrders", { query });
      throw error;
    }
  }

  async getOrderDetails(orderId: string): Promise<any> {
    try {
      const order = await this.repository.getOrderById(orderId);
      if (!order) {
        throw new AppError(
          "Order not found",
          404,
          true,
          undefined,
          "ORDER_NOT_FOUND",
        );
      }
      return order;
    } catch (error) {
      this._handleError(error, "getOrderDetails", { orderId });
      throw error;
    }
  }

  async createOrder(
    createData: OrderCreate["body"],
    metaData: IMetaData,
  ): Promise<any> {
    try {
      const { items, ...orderInfo } = createData;

      const order = await this.repository.createOrderWithTransaction(
        metaData,
        orderInfo,
        items,
      );

      if (createData.paymentMethod === "ONLINE") {
        // await this.eventBus.publish("ORDER_STOCK_HOLD", {
        //   orderId: order.id,
        //   orderNumber: order.orderNumber,
        //   items: items,
        // });
        // const FIVE_MINUTES_IN_MS = env.STOCK_TIMEOUT;
        // await this.eventBus.publishDelayed(
        //   "ORDER_PAYMENT_TIMEOUT",
        //   {
        //     orderId: order.id,
        //     orderNumber: order.orderNumber,
        //     userId: metaData.id,
        //     items: items,
        //   },
        //   FIVE_MINUTES_IN_MS,
        //   {
        //     correlationId: order.orderNumber,
        //     origin: "order_service",
        //     version: 1,
        //   },
        // );
      } else {
        // todo : here admin get notification then call user and confirm and update status .the stock reduces.
        // await this.eventBus.publish("ORDER_CREATED", {
        //   orderId: order.id,
        //   orderNumber: order.orderNumber,
        //   items: items,
        // });
      }

      return order;
    } catch (error) {
      this._handleError(error, "createOrder", { createData });
      throw error;
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: any,
    paymentStatus?: PaymentStatus,
    note?: string | null | undefined,
  ): Promise<any> {
    try {
      return await this.repository.updateOrderStatus(
        orderId,
        status,
        paymentStatus,
        note,
      );
    } catch (error) {
      this._handleError(error, "updateOrderStatus", { orderId, status });
      throw error;
    }
  }

  async repayOrder(orderId: string, metaData: IMetaData): Promise<any> {
    try {
      const order = await this.repository.getOrderById(orderId);
      if (!order) {
        throw new AppError(
          "Order not found",
          404,
          true,
          undefined,
          "ORDER_NOT_FOUND",
        );
      }

      if (order.status !== "CANCELLED") {
        throw new AppError(
          "Only cancelled or expired orders are eligible for repayment",
          400,
          true,
          undefined,
          "INVALID_ORDER_STATUS",
        );
      }

      const allocationPlan = order.allocationPlan;

      if (
        !allocationPlan ||
        !Array.isArray(allocationPlan) ||
        allocationPlan.length === 0
      ) {
        throw new AppError(
          "Allocation plan not found for this order. Cannot re-reserve stock.",
          400,
          true,
          undefined,
          "ALLOCATION_PLAN_NOT_FOUND",
        );
      }

      const stockPayload = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        allocationPlan,
      };

      try {
        await this.service.post("inventory", "/stock-level/hold", stockPayload);
      } catch (error: any) {
        throw new AppError(
          "Sorry, some items in your order are currently out of stock. Cannot proceed with repayment.",
          400,
          true,
          undefined,
          "OUT_OF_STOCK",
        );
      }

      let updatedOrder;
      try {
        updatedOrder = await this.repository.updateOrderStatus(
          orderId,
          "PENDING",
        );
      } catch (dbError) {
        await this.eventBus.publish("ORDER_STOCK_RELEASE", {
          orderId: order.id,
          orderNumber: order.orderNumber,
          allocationPlan,
          reason: "REPAY_DB_TRANSACTION_FAILED",
        });
        throw dbError;
      }
      const STOCK_TIMEOUT_MS = env.STOCK_TIMEOUT || 600000;
      await this.eventBus.publishDelayed(
        "ORDER_PAYMENT_TIMEOUT",
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: metaData.id,
          allocationPlan: allocationPlan,
        },
        STOCK_TIMEOUT_MS,
        {
          correlationId: order.orderNumber,
          origin: "order_service",
          version: 1,
        },
      );

      return updatedOrder;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this._handleError(error, "repayOrder", { orderId });
      throw error;
    }
  }
}
