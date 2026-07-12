import type { ProductCategoryEntity } from "../entities/product-category.entity";

export interface IProductCategoryRepository {
  lockCompanyGraph(companyId: string): Promise<void>;
  findById(id: string): Promise<ProductCategoryEntity | null>;
  list(companyId: string): Promise<ProductCategoryEntity[]>;
  save(category: ProductCategoryEntity): Promise<void>;
  update(category: ProductCategoryEntity): Promise<void>;
  detachProducts(categoryId: string): Promise<void>;
  reparentChildren(categoryId: string, parentId: string | null): Promise<void>;
}
