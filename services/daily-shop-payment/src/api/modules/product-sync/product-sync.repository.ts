import { BaseRepository } from "../../../core/base/base.repository";

export class ProductSyncRepository extends BaseRepository<"productVariant"> {
  constructor() {
    super("productVariant");
  }

  // Find product variant by ID
  async findVariantById(id: string) {
    return await this.model.findUnique({
      where: { id },
    });
  }

  // Upsert product variant (Create or Update from product service)
  async upsertVariant(data: {
    id: string;
    productId: string;
    sku: string;
    barcode?: string;
    name: string;
    price: number;
    discountPrice?: number;
    costPrice?: number;
    unit: string;
    weightValue?: number;
    attributes?: any;
    images?: string[];
    isDefault?: boolean;
  }) {
    return await this.model.upsert({
      where: { id: data.id },
      update: {
        productId: data.productId,
        sku: data.sku,
        barcode: data.barcode,
        name: data.name,
        price: data.price,
        discountPrice: data.discountPrice,
        costPrice: data.costPrice,
        unit: data.unit,
        weightValue: data.weightValue,
        attributes: data.attributes,
        images: data.images,
        isDefault: data.isDefault,
      },
      create: {
        id: data.id,
        productId: data.productId,
        sku: data.sku,
        barcode: data.barcode,
        name: data.name,
        price: data.price,
        discountPrice: data.discountPrice,
        costPrice: data.costPrice,
        unit: data.unit,
        weightValue: data.weightValue,
        attributes: data.attributes,
        images: data.images,
        isDefault: data.isDefault ?? false,
      },
    });
  }

  // Soft delete variant reference if needed
  async updateVariantStatus(id: string, isDeleted: boolean) {
    return await this.model.update({
      where: { id },
      data: { isDeleted },
    });
  }

  async getAllSyncedVariants(query: any) {
    return await this.getList(query);
  }
}