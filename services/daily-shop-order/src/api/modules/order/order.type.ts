export interface IProductVariant {
  id: string;
  productId: string;
  strategy: string;
  sku: string;
  barcode: string;
  name: string;
  price: number;
  discountPrice: number;
  costPrice: number;
  unit: string;
  weightValue: number;
  attributes: Attributes;
  images: string[];
  isDefault: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attributes {
  packSize: string;
}

export interface VariantDetail {
  stock: number;
  expiryDate: string;
  strategy: string;
}

export interface BranchStockItem {
  branchId: string;
  branchName: string;
  isCentralHub: boolean;
  distanceKm: number;
  variants: Record<string, VariantDetail>;
}

export type BranchStockList = BranchStockItem[];
