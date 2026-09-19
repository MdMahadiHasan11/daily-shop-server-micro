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
    return await this.transaction(async (tx) => {
      const { tags, variants, ...productData } = createData;

      const product = await tx.product.create({
        data: productData,
      });

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

          try {
            const payload = {
              id: newVariant.id,
              productId: product.id,
              sku: newVariant.sku,
              barcode: newVariant.barcode,
              name: newVariant.name,
              price: newVariant.price,
              discountPrice: newVariant.discountPrice,
              costPrice: newVariant.costPrice,
              unit: newVariant.unit,
              weightValue: newVariant.weightValue,
              attributes: newVariant.attributes,
              images: newVariant.images,
              isDefault: newVariant.isDefault,
            };

            await this.service.post("inventory", "/product-sync/sync", payload);
          } catch (syncError: any) {
            console.error(
              `Failed to sync variant ${newVariant.sku} with inventory service:`,
              syncError?.message,
            );

            // 🛑 FIX 3 (Rollback Handle):
            throw new AppError(
              `Inventory synchronization failed for variant: ${newVariant.sku}. Product creation rolled back.`,
              500,
              true,
              undefined,
              "INVENTORY_SYNC_FAILED",
            );
          }
        }
      }

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
  }
}
