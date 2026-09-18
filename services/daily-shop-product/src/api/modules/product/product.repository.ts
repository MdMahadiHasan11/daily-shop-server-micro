import { PaginationResult } from "../../../common/interfaces";
import { BaseRepository } from "../../../core/base/base.repository";
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
      const { variants, ...productData } = createData;

      // ১. মূল প্রোডাক্ট তৈরি
      const product = await tx.product.create({
        data: productData,
      });

      // ২. প্রোডাক্টের ভেরিয়েন্টগুলো একসাথে তৈরি
      if (variants && variants.length > 0) {
        for (const variant of variants) {
          await tx.productVariant.create({
            data: {
              ...variant,
              productId: product.id,
            },
          });
        }
      }

      // সম্পূর্ণ ডেটা রিলেশন সহ রিটার্ন করা
      return await tx.product.findUnique({
        where: { id: product.id },
        include: {
          variants: true,
          category: true,
          brand: true,
        },
      });
    });
  }
}