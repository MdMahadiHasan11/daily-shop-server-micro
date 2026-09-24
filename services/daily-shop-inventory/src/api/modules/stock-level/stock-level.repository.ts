import { BaseRepository } from "../../../core/base/base.repository";
import { AppError } from "../../../core/errors/errors";
import { logger } from "../../../core/utils/logger.utils";

export class StockLevelRepository extends BaseRepository<"stockLevel"> {
  constructor() {
    super("stockLevel");
  }

  // Find stock level by ID with relations (warehouse & productVariant)
  async findByIdWithRelations(id: string) {
    return await (this.model as any).findUnique({
      where: { id },
      include: {
        warehouse: true,
        productVariant: true,
      },
    });
  }

  // Find a stock level by warehouse ID and product variant ID
  async findByWarehouseAndVariant(
    warehouseId: string,
    productVariantId: string,
  ) {
    return await (this.model as any).findUnique({
      where: {
        warehouseId_productVariantId: {
          warehouseId,
          productVariantId,
        },
      },
      include: {
        warehouse: true,
        productVariant: true,
      },
    });
  }

  // Find low-stock items where quantity is less than or equal to reorderLevel
  async findLowStockItems(warehouseId?: string) {
    const whereCondition: any = {};

    if (warehouseId) {
      whereCondition.warehouseId = warehouseId;
    }

    return await (this.model as any).findMany({
      where:
        Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
      include: {
        warehouse: true,
        productVariant: true,
      },
    });
  }

  async getStockByProductVariantId(
    productVariantId: string,
    selectFields?: any,
  ) {
    return await (this.model as any).findMany({
      where: { productVariantId },
      ...(selectFields
        ? { select: selectFields }
        : {
            include: {
              warehouse: true,
              productVariant: true,
            },
          }),
    });
  }

  async OrderCheck(orderId: string) {
    try {
      const response = await this.service.get("order", `/${orderId}`);
      const order = response.data;
      return order;
    } catch (err) {
      console.error("Failed to check stock from Order Service:", err);
      return null;
    }
  }

  async OrderStatusUpdate(orderId: string) {
    try {
      await this.service.patch("order", `/${orderId}/status`, {
        status: "CANCELLED",
        note: "Stock released due to order timeout/cancellation",
      });

      logger.info(
        { orderId },
        "Stock released successfully and order status updated to CANCELLED in Order Service. 🚀",
      );
    } catch (orderUpdateErr: any) {
      logger.error(
        { orderId, err: orderUpdateErr },
        "Stock was released successfully, but failed to update order status to CANCELLED in Order Service.",
      );

      // AppError
      const statusCode = orderUpdateErr?.statusCode || 400;
      const message =
        orderUpdateErr?.message ||
        "Stock released, but failed to synchronize status with Order Service";

      throw new AppError(
        message,
        statusCode,
        true,
        orderUpdateErr?.details || orderUpdateErr,
        "INTER_SERVICE_ERROR",
      );
    }
  }
}
