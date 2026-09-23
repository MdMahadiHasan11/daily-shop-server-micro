import { PaginationResult } from "../../../common/interfaces";
import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { ProductVariantRepository } from "./variant.repository";
import {
  ProductVariantCreate,
  ProductVariantListQuery,
} from "./variant.validator";

export class ProductVariantService extends BaseService {
  private readonly repository: ProductVariantRepository;

  constructor() {
    super();
    this.repository = new ProductVariantRepository();
    this.serviceName = "ProductService";
  }

  async getAllProductVariant(
    query: ProductVariantListQuery["query"],
  ): Promise<PaginationResult<any>> {
    try {
      return await this.repository.getAllProductVariant(query);
    } catch (error) {
      this._handleError(error, "getAllProductVarian", { query });
      throw error;
    }
  }

  async getProductVariantDetails(variantId: string): Promise<any> {
    try {
      const variant = await this.repository.getProductVariantById(variantId);
      if (!variant) {
        throw new AppError(
          "Product not found",
          404,
          true,
          undefined,
          "PRODUCT_NOT_FOUND",
        );
      }
      return variant;
    } catch (error) {
      this._handleError(error, "getProductDetails", { variantId });
      throw error;
    }
  }

  async createProductVariant(
    productVariantData: ProductVariantCreate["body"],
  ): Promise<any> {
    try {
      return await this.repository.createProductWithVariants(
        productVariantData,
      );
    } catch (error) {
      this._handleError(error, "productVariant", { productVariantData });
      throw error;
    }
  }

  async getVariantsByBulk(variantIds: string[]): Promise<any[]> {
    try {
      return await this.repository.getVariantsByBulk(variantIds);
    } catch (error) {
      this._handleError(error, "getVariantsByBulk", { variantIds });
      throw error;
    }
  }
}
