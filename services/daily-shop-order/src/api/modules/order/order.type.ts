export interface IProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode?: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  costPrice?: number;
  unit: string;
  weightValue?: number;
  attributes?: Record<string, any>;
  images?: string[];
  isDefault?: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}
