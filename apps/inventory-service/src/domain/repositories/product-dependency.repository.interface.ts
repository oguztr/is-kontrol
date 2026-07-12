export interface IProductDependencyRepository {
  lockCategoryGraphShared(companyId: string): Promise<void>;
  unitBelongsToCompany(unitId: string, companyId: string): Promise<boolean>;
  categoryBelongsToCompany(categoryId: string, companyId: string): Promise<boolean>;
}
