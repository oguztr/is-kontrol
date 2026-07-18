export interface ProductReference {
  id: string;
  companyId: string;
  sku: string;
  barcode: string | null;
  name: string;
  isActive: boolean;
  syncedAt: Date;
}

export interface IProductReferenceRepository {
  findById(id: string): Promise<ProductReference | null>;
  upsert(reference: ProductReference): Promise<void>;
  setActive(id: string, isActive: boolean, syncedAt: Date): Promise<void>;
}
