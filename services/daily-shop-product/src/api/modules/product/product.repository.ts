import { EVENTS } from "../../../bootstrap/event.constants";
import { PaginationResult } from "../../../common/interfaces";
import { BaseRepository } from "../../../core/base/base.repository";
import { AppError } from "../../../core/errors/errors";
import { ProductListQuery } from "./product.validator";

export class ProductRepository extends BaseRepository<"product"> {
  constructor() {
    super("product");
  }

  async getAllProducts(
    query: ProductListQuery["query"],
  ): Promise<PaginationResult<any>> {
    return await this.getList(query);
  }

  async getProductById(productId: string) {
    return await this.model.findUnique({
      where: { id: productId, isDeleted: false },
      include: {
        category: true,
        brand: true,
        variants: { where: { isDeleted: false } },
        tags: { include: { tag: true } },
      },
    });
  }

  async createProductWithVariants(createData: any) {
    // 1. Database Transaction: Save product, tags, and variants in the local database
    const productResult = await this.transaction(async (tx) => {
      const { tags, variants, ...productData } = createData;

      // Create product
      const product = await tx.product.create({
        data: productData,
      });

      // Assign tags
      if (tags && tags.length > 0) {
        for (const tagId of tags) {
          await tx.productTag.create({
            data: {
              productId: product.id,
              tagId: tagId,
            },
          });
        }
      }

      // Create variants
      const createdVariants = [];
      if (variants && variants.length > 0) {
        for (const variant of variants) {
          const newVariant = await tx.productVariant.create({
            data: {
              ...variant,
              productId: product.id,
            },
          });
          createdVariants.push(newVariant);
        }
      }

      // Return full product data with relations
      return await tx.product.findUnique({
        where: { id: product.id },
        include: {
          variants: true,
          category: true,
          brand: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    // 🛑 Safety check: If productResult is null or undefined for any reason
    if (!productResult) {
      throw new AppError(
        "Failed to create product. Transaction returned null.",
        500,
        true,
        undefined,
        "PRODUCT_CREATION_FAILED",
      );
    }

    // 2. RabbitMQ Event Publishing (Strict Real-Time Sync Handling)
    try {
      await this.eventBus.publish(EVENTS.AFTER_PRODUCT_CREATE_NEED_INVENTORY, {
        productId: productResult.id,
        productName: productResult.name,
        slug: productResult.slug,
        variants: productResult.variants.map((variant) => ({
          id: variant.id,
          productId: productResult.id,
          sku: variant.sku,
          barcode: variant.barcode,
          name: variant.name,
          price: variant.price,
          discountPrice: variant.discountPrice,
          costPrice: variant.costPrice,
          unit: variant.unit,
          weightValue: variant.weightValue,
          attributes: variant.attributes,
          images: variant.images,
          isDefault: variant.isDefault,
        })),
      });
    } catch (publishError: any) {
      console.error(
        `Failed to publish inventory event for product ID ${productResult.id}:`,
        publishError?.message,
      );

      // If event publishing fails, soft-delete the product record to maintain data consistency
      await this.model.update({
        where: { id: productResult.id },
        data: { isDeleted: true },
      });

      throw new AppError(
        `Failed to initialize inventory for product: ${productResult.name}. Operation aborted.`,
        500,
        true,
        undefined,
        "INVENTORY_EVENT_PUBLISH_FAILED",
      );
    }

    return productResult;
  }

  async getVariantsByBulk(variantIds: string[]) {
    return await this.prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        isDeleted: false,
      },
    });
  }
}
