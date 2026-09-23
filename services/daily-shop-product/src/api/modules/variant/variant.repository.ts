import { EVENTS } from "../../../bootstrap/event.constants";
import { PaginationResult } from "../../../common/interfaces";
import { BaseRepository } from "../../../core/base/base.repository";
import { AppError } from "../../../core/errors/errors";
import {
  ProductVariantCreate,
  ProductVariantListQuery,
} from "./variant.validator";

export class ProductVariantRepository extends BaseRepository<"productVariant"> {
  constructor() {
    super("productVariant");
  }

  async getAllProductVariant(
    query: ProductVariantListQuery["query"],
  ): Promise<PaginationResult<any>> {
    return await this.getList(query);
  }

  async getProductVariantById(variantId: string) {
    return await this.model.findUnique({
      where: { id: variantId, isDeleted: false },
      include: {
        product: true,
      },
    });
  }

  async createProductWithVariants(
    productVariantData: ProductVariantCreate["body"],
  ) {
    const createdVariants = await this.transaction(async (tx) => {
      const variantData = productVariantData.variants;
      const results = [];

      if (variantData && variantData.length > 0) {
        for (const variant of variantData) {
          const newVariant = await tx.productVariant.create({
            data: {
              ...variant,
              productId: productVariantData.productId,
            },
            include: {
              product: true,
            },
          });
          results.push(newVariant);
        }
      }

      return results;
    });

    if (!createdVariants || createdVariants.length === 0) {
      throw new AppError(
        "Failed to create product variants. Transaction returned empty results.",
        500,
        true,
        undefined,
        "VARIANT_CREATION_FAILED",
      );
    }

    const product = createdVariants[0].product;
    const productId = productVariantData.productId;

    try {
      await this.eventBus.publish(EVENTS.AFTER_PRODUCT_CREATE_NEED_INVENTORY, {
        productId: productId,
        productName: product?.name || "",
        slug: product?.slug || "",
        variants: createdVariants.map((variant) => ({
          id: variant.id,
          productId: productId,
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
        `Failed to publish inventory event for variants under product ID ${productId}:`,
        publishError?.message,
      );

      try {
        await this.transaction(async (tx) => {
          const variantIds = createdVariants.map((v) => v.id);
          await tx.productVariant.deleteMany({
            where: { id: { in: variantIds } },
          });
        });
      } catch (cleanupError: any) {
        console.error(
          `Failed to delete variants during rollback for product ID ${productId}:`,
          cleanupError?.message,
        );
      }

      throw new AppError(
        `Failed to initialize inventory for product variants. Operation aborted.`,
        500,
        true,
        undefined,
        "INVENTORY_EVENT_PUBLISH_FAILED",
      );
    }

    return createdVariants;
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
