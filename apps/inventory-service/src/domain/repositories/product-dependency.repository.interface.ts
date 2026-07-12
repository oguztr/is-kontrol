export interface IProductDependencyRepository {
  unitBelongsToCompany(unitId: string, companyId: string): Promise<boolean>;
  categoryBelongsToCompany(categoryId: string, companyId: string): Promise<boolean>;
}
