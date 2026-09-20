import { PaginationResult } from "../../../common/interfaces";
import { BaseService } from "../../../core/base/base.service";
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

       const FIVE_MINUTES_IN_MS = 1 * 10 * 1000;

        await this.eventBus.publishDelayed(
          "ORDER_PAYMENT_TIMEOUT",
          {
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId: metaData.id,
            items: items,
          },
          FIVE_MINUTES_IN_MS,
          {
            correlationId: order.orderNumber,
            origin: "order_service",
            version: 1,
          },
        );

      if (order.paymentMethod === "ONLINE") {
        await this.eventBus.publish("ORDER_STOCK_HOLD", {
          orderId: order.id,
          orderNumber: order.orderNumber,
          items: items,
        });

        const FIVE_MINUTES_IN_MS = 1 * 10 * 1000;

        await this.eventBus.publishDelayed(
          "ORDER_PAYMENT_TIMEOUT",
          {
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId: metaData.id,
            items: items,
          },
          FIVE_MINUTES_IN_MS,
          {
            correlationId: order.orderNumber,
            origin: "order_service",
            version: 1,
          },
        );
      } else {
        // COD (Cash on Delivery)
        await this.eventBus.publish("ORDER_CREATED", {
          orderId: order.id,
          orderNumber: order.orderNumber,
          items: items,
        });
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
  ): Promise<any> {
    try {
      return await this.repository.updateOrderStatus(
        orderId,
        status,
        note,
        userId,
      );
    } catch (error) {
      this._handleError(error, "updateOrderStatus", { orderId, status });
      throw error;
    }
  }
}
