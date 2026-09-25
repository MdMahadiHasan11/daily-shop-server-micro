import { PaymentStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { PaginationResult } from "../../../common/interfaces";
import { BaseRepository } from "../../../core/base/base.repository";
import { env } from "../../../core/config/env.config";
import { AppError } from "../../../core/errors/errors";
import { IMetaData } from "../../../core/utils/request-metadata";
import {
  CartItem,
  smartAllocateInventoryWithStrategies,
} from "../../algorithm/smartAllocation";
import { Utils } from "../../utils/order.utils";
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

 async updateOrderStatus(
    orderId: string,
    status: any,
    paymentStatus?: PaymentStatus,
    note?: string | null | undefined,
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

        // If status is the same, return early without unnecessary updates
        if (order.status === status && (!paymentStatus || order.paymentStatus === paymentStatus)) {
          return { updatedOrder: order, previousStatus: order.status };
        }

        // Dynamically build the update data object to handle optional parameters safely
        const updateData: any = {
          status,
          statusHistory: {
            create: {
              status,
              note: note || `Status changed to ${status}`,
              changedBy: order.userId,
            },
          },
        };

        // Include paymentStatus only if it is explicitly provided
        if (paymentStatus !== undefined) {
          updateData.paymentStatus = paymentStatus;
        }

        const updatedOrderResult = await tx.order.update({
          where: { id: orderId },
          data: updateData,
          include: { items: true, statusHistory: true },
        });

        return {
          updatedOrder: updatedOrderResult,
          previousStatus: order.status,
        };
      },
    );

    if (previousStatus !== "CONFIRMED" && status === "CONFIRMED") {
      if (updatedOrder.allocationPlan) {
        await this.eventBus.publish("ORDER_CONFIRMED", {
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          allocationPlan: updatedOrder.allocationPlan,
        });
      }
    }

    return updatedOrder;
  }

  async createOrderWithTransaction(
    metaData: IMetaData,
    orderData: Omit<OrderCreate["body"], "items">,
    itemsData: OrderCreate["body"]["items"],
  ) {
    let subTotal = 0;
    const variantIds = itemsData.map((item) => item.productVariantId);

    // Step 1: Fetch product variants and warehouse stock levels concurrently
    const [productResponse, rawBranchStocks] = await Promise.all([
      this.service.post("product", "/variant/bulk", { variantIds }),
      this.service.post("inventory", "/warehouse/stock", {
        variantIds,
        customerCity: orderData.city || "Dhaka",
      }),
    ]);

    const variants = productResponse.data || [];

    const availableBranches = (rawBranchStocks.data || []).map(
      (branch: any) => ({
        ...branch,
        variants: Object.fromEntries(
          Object.entries(branch.variants || {}).map(
            ([variantId, variantInfo]: [string, any]) => [
              variantId,
              {
                ...variantInfo,
                expiryDate: new Date(variantInfo.expiryDate),
              },
            ],
          ),
        ),
      }),
    );

    const cartItems: CartItem[] = itemsData.map((item) => {
      const variant = variants.find((v: any) => v.id === item.productVariantId);
      return {
        variantId: item.productVariantId,
        quantity: item.quantity,
        strategy: variant?.strategy || "FEFO_FIRST",
      };
    });

    // Step 2: Generate the smart inventory allocation plan based on strategies
    const allocationPlan = smartAllocateInventoryWithStrategies(
      cartItems,
      availableBranches,
      "FEFO_FIRST",
    );

    // Pre-generate unique identifiers for tracking
    const orderId = randomUUID();
    const orderNumber = Utils.order.generateOrderNumber();

    // Prepare the exact stock payload needed for holding stock
    const stockPayload = {
      orderId,
      orderNumber,
      allocationPlan,
    };

    // Step 3: Hold/Lock inventory stock FIRST
    try {
      await this.service.post("inventory", "/stock-level/hold", stockPayload);
    } catch (error) {
      throw new AppError(
        "Stock is insufficient or unavailable for allocation",
        400,
        true,
        undefined,
        "OUT_OF_STOCK",
      );
    }

    // Step 4: Format order items and perform mid-flight validations
    const formattedOrderItems: Array<any> = [];
    for (const item of itemsData) {
      const variant = variants.find((v: any) => v.id === item.productVariantId);

      if (!variant || variant.isDeleted) {
        // ⚠️ Compensation Action: Publish immediate release event if validation fails mid-flight
        await this.eventBus.publish("ORDER_STOCK_RELEASE", {
          orderId,
          orderNumber,
          allocationPlan,
          reason: "VARIANT_NOT_FOUND",
        });

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

    // Step 5: Create the order inside the database transaction
    try {
      const createdOrderResult = await this.transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            id: orderId,
            orderNumber,
            userId: metaData.id as string,
            userAddressId: orderData.userAddressId || null,
            paymentMethod: orderData.paymentMethod,
            subTotal,
            discountAmount,
            shippingFee,
            taxAmount,
            totalAmount,
            allocationPlan: JSON.parse(JSON.stringify(allocationPlan)),
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
        return {
          order: newOrder,
          allocationPlan,
        };
      });

      // Step 6: Publish a delayed event for payment timeout (e.g., 10 minutes)
      const STOCK_TIMEOUT_MS = env.STOCK_TIMEOUT || 600000;
      await this.eventBus.publishDelayed(
        "ORDER_PAYMENT_TIMEOUT",
        {
          orderId: orderId,
          orderNumber: orderNumber,
          userId: metaData.id,
          allocationPlan: allocationPlan,
        },
        STOCK_TIMEOUT_MS,
        {
          correlationId: orderNumber,
          origin: "order_service",
          version: 1,
        },
      );

      return createdOrderResult;
    } catch (dbError) {
      // ⚠️ Event-Driven Compensation: Publish immediate release event if database transaction fails
      await this.eventBus.publish("ORDER_STOCK_RELEASE", {
        orderId,
        orderNumber,
        allocationPlan,
        reason: "DB_TRANSACTION_FAILED",
      });

      throw dbError;
    }
  }
}
