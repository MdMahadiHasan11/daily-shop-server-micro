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
    note: string | null | undefined,
    userId: string,
    paymentStatus?: PaymentStatus,
  ): Promise<any> {
    try {
      return await this.repository.updateOrderStatus(
        orderId,
        status,
        note,
        userId,
        paymentStatus,
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

      for (const item of order.items) {
        const availableStock = await this.repository.checkStockAvailability(
          item.productVariantId,
        );
        if (availableStock < item.quantity) {
          throw new AppError(
            `Insufficient stock for product. Available: ${availableStock}, Requested: ${item.quantity}`,
            400,
            true,
            undefined,
            "OUT_OF_STOCK",
          );
        }
      }

      const updatedOrder = await this.repository.updateOrderStatus(
        orderId,
        "PENDING",
        "Payment retried by customer, stock re-reserved",
        metaData.id as string,
      );

      await this.eventBus.publish("ORDER_STOCK_HOLD", {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        items: updatedOrder.items,
      });

      const FIVE_MINUTES_IN_MS = env.STOCK_TIMEOUT;

      await this.eventBus.publishDelayed(
        "ORDER_PAYMENT_TIMEOUT",
        {
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          userId: metaData.id,
          items: updatedOrder.items,
        },
        FIVE_MINUTES_IN_MS,
        {
          correlationId: updatedOrder.orderNumber,
          origin: "order_service",
          version: 1,
        },
      );
      return updatedOrder;
    } catch (error) {
      this._handleError(error, "repayOrder", { orderId });
      throw error;
    }
  }
}
