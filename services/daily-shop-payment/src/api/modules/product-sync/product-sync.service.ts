import { BaseService } from "../../../core/base/base.service";
import { AppError } from "../../../core/errors/errors";
import { ProductSyncRepository } from "./product-sync.repository";

export class ProductSyncService extends BaseService {
  private readonly repository: ProductSyncRepository;

  constructor() {
    super();
    this.repository = new ProductSyncRepository();
    this.serviceName = "ProductSyncService";
  }

  // Sync (Create or Update) product variant from product service
  async syncProductVariant(data: any) {
    try {
      if (!data || !data.id || !data.sku || !data.name) {
        throw new AppError(
          "Invalid payload provided for product variant sync",
          400,
          true,
          undefined,
          "INVALID_SYNC_DATA",
        );
      }

      const syncedVariant = await this.repository.upsertVariant(data);
      return syncedVariant;
    } catch (error) {
      this._handleError(error, "syncProductVariant", { data });
      throw error;
    }
  }

  // Get synced variant by ID
  async getSyncedVariantById(id: string) {
    try {
      const variant = await this.repository.findVariantById(id);
      if (!variant) {
        throw new AppError(
          "Product variant not found in inventory sync records",
          404,
          true,
          undefined,
          "VARIANT_NOT_FOUND",
        );
      }
      return variant;
    } catch (error) {
      this._handleError(error, "getSyncedVariantById", { id });
      throw error;
    }
  }

  // Get all synced variants
  async getAllSyncedVariants(query: any) {
    try {
      return await this.repository.getAllSyncedVariants(query);
    } catch (error) {
      this._handleError(error, "getAllSyncedVariants", { query });
      throw error;
    }
  }
}
