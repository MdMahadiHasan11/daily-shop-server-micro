import { PaymentStatus } from "@prisma/client";
import { PaginationResult } from "../../../common/interfaces";
import { BaseRepository } from "../../../core/base/base.repository";
import { AppError } from "../../../core/errors/errors";
import { IMetaData } from "../../../core/utils/request-metadata";
import { Utils } from "../../utils/order.utils";
import { IProductVariant } from "./order.type";
import { OrderCreate, OrderListQuery } from "./order.validator";
interface OrderItem {
  productVariantId: string;
  quantity: number;
  [key: string]: any;
}

interface TransformedItem {
  productVariantId: string;
  quantity: number;
  warehouseId?: string;
}
export class OrderRepository extends BaseRepository<"order"> {
  constructor() {
    super("order");
  }

  transformOrderItems(
    items: OrderItem[],
    warehouseId?: string,
  ): TransformedItem[] {
    try {
      return items.map((item) => ({
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        ...(warehouseId && { warehouseId }),
      }));
    } catch (err) {
      console.error("Failed to transform order items:", err);
      return [];
    }
  }

  async checkStockAvailability(productVariantId: string): Promise<number> {
    try {
      const response = await this.service.get(
        "inventory",
        `/stock-level/stock/${productVariantId}?fields=minimal`,
      );
      const maxSingleWarehouseStock =
        response.data?.maxSingleWarehouseStock || 0;
      return maxSingleWarehouseStock;
    } catch (err) {
      console.error("Failed to check stock from Inventory Service:", err);
      return 0;
    }
  }

  async getAllOrders(
    query: OrderListQuery["query"],
  ): Promise<PaginationResult<any>> {
    return await this.getList(query, {
      include: {
        items: true,
        statusHistory: true,
      },
    });
  }

  async getOrderById(orderId: string) {
    return await this.model.findUnique({
      where: { id: orderId, isDeleted: false },
      include: {
        items: true,
        statusHistory: true,
      },
    });
  }

  async createOrderWithTransaction(
    metaData: IMetaData,
    orderData: Omit<OrderCreate["body"], "items">,
    itemsData: OrderCreate["body"]["items"],
  ) {
    let subTotal = 0;

    const formattedOrderItems: Array<{
      productVariantId: string;
      productName: string;
      sku: string;
      image: string | null;
      price: number;
      quantity: number;
      totalPrice: number;
    }> = [];

    const variantIds = itemsData.map((item) => item.productVariantId);

    const productResponse = await this.service.post(
      "product",
      "/variants/bulk",
      {
        variantIds,
      },
    );

    const variants: IProductVariant[] = productResponse.data || [];

    for (const item of itemsData) {
      const availableStock = await this.checkStockAvailability(
        item.productVariantId,
      );

      if (availableStock < item.quantity) {
        throw new AppError(
          `Insufficient stock for product . Available: ${availableStock} quantity  at a time. `,
          400,
          true,
          undefined,
          "OUT_OF_STOCK",
        );
      }

      const variant = variants.find((v) => v.id === item.productVariantId);

      if (!variant || variant.isDeleted) {
        throw new AppError(
          `Product variant not found or deleted: ${item.productVariantId}`,
          400,
          true,
          undefined,
          "VARIANT_NOT_FOUND",
        );
      }

      const price = variant.discountPrice ?? variant.price;
      const totalPrice = price * item.quantity;
      subTotal += totalPrice;

      formattedOrderItems.push({
        productVariantId: variant.id,
        productName: variant.name,
        sku: variant.sku,
        image: variant.images?.[0] || null,
        price: price,
        quantity: item.quantity,
        totalPrice: totalPrice,
      });
    }

    const rawOrderData = orderData as any;
    const shippingFee = rawOrderData.shippingFee || 0;
    const discountAmount = rawOrderData.discountAmount || 0;
    const taxAmount = rawOrderData.taxAmount || 0;
    const totalAmount = subTotal + shippingFee + taxAmount - discountAmount;

    const isCOD = orderData.paymentMethod === "COD";
    const initialNote = isCOD
      ? "COD order placed successfully, awaiting admin confirmation"
      : "Online order placed successfully, awaiting payment";

    return await this.transaction(async (tx) => {
      const orderNumber = Utils.order.generateOrderNumber();

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: metaData.id as string,
          userAddressId: orderData.userAddressId || null,
          paymentMethod: orderData.paymentMethod,
          subTotal,
          discountAmount,
          shippingFee,
          taxAmount,
          totalAmount,
          shippingName: orderData.shippingName,
          shippingPhone: orderData.shippingPhone,
          shippingEmail: orderData.shippingEmail,
          shippingAddress: orderData.shippingAddress,
          city: orderData.city,
          state: orderData.state,
          postalCode: orderData.postalCode,
          country: orderData.country || "Bangladesh",
          notes: orderData.notes,
          items: {
            create: formattedOrderItems,
          },
          statusHistory: {
            create: {
              status: "PENDING",
              note: initialNote,
              changedBy: metaData.id as string,
            },
          },
        },
        include: {
          items: true,
          statusHistory: true,
        },
      });

      return newOrder;
    });
  }

  async updateOrderStatus(
    orderId: string,
    status: any,
    note: string | null | undefined,
    changedBy: string,
    paymentStatus?: PaymentStatus,
  ) {
    // 1. Transaction block for database operations
    const { updatedOrder, previousStatus } = await this.transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true, statusHistory: true },
        });

        if (!order) {
          throw new AppError(
            "Order not found",
            404,
            true,
            undefined,
            "ORDER_NOT_FOUND",
          );
        }

        if (order.status === status) {
          return { updatedOrder: order, previousStatus: order.status };
        }

        const updatedOrderResult = await tx.order.update({
          where: { id: orderId },
          data: {
            status,
            ...(paymentStatus !== undefined && { paymentStatus }),
            statusHistory: {
              create: {
                status,
                note: note || `Status changed to ${status}`,
                changedBy,
              },
            },
          },
          include: { items: true, statusHistory: true },
        });

        return {
          updatedOrder: updatedOrderResult,
          previousStatus: order.status,
        };
      },
    );

    const payload = {
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      items: this.transformOrderItems(updatedOrder.items),
    };

    // 2. Trigger event ONLY when transitioning from PENDING to CONFIRMED
    if (previousStatus === "PENDING" && status === "CONFIRMED") {
      await this.eventBus.publish("ORDER_CONFIRMED", payload);
    }

    return updatedOrder;
  }
}
