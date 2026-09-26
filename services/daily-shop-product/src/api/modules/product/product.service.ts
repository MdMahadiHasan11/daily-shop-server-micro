import { PaginationResult } from "../../../common/interfaces";
import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { ProductRepository } from "./product.repository";
import { ProductListQuery } from "./product.validator";

export class ProductService extends BaseService {
  private readonly repository: ProductRepository;

  constructor() {
    super();
    this.repository = new ProductRepository();
    this.serviceName = "ProductService";
  }

  async getAllProducts(
    query: ProductListQuery["query"],
  ): Promise<PaginationResult<any>> {
    try {
      return await this.repository.getAllProducts(query);
    } catch (error) {
      this._handleError(error, "getAllProducts", { query });
      throw error;
    }
  }

  async getProductDetails(productId: string): Promise<any> {
    try {
      const product = await this.repository.getProductById(productId);
      if (!product) {
        throw new AppError(
          "Product not found",
          404,
          true,
          undefined,
          "PRODUCT_NOT_FOUND",
        );
      }
      return product;
    } catch (error) {
      this._handleError(error, "getProductDetails", { productId });
      throw error;
    }
  }

  async createProduct(createData: any): Promise<any> {
    try {
      return await this.repository.createProductWithVariants(createData);
    } catch (error) {
      this._handleError(error, "createProduct", { createData });
      throw error;
    }
  }

  async getProductsByBulk(productIds: string[]): Promise<any[]> {
    try {
      return await this.repository.getProductsByBulk(productIds);
    } catch (error) {
      this._handleError(error, "getProductsByBulk", { productIds });
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
