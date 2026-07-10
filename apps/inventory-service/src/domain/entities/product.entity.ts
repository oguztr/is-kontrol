export class ProductEntity {
  public readonly id: string;
  public readonly companyId: string;
  public readonly sku: string;
  public name: string;
  public description: string | null;
  public readonly baseUnitId: string;
  public categoryId: string | null;
  public defaultCurrencyId: string | null;
  public minStockLevel: string;
  public maxStockLevel: string | null;
  public isActive: boolean;
  public readonly createdAt: Date;

  constructor(params: {
    id: string;
    companyId: string;
    sku: string;
    name: string;
    description: string | null;
    baseUnitId: string;
    categoryId: string | null;
    defaultCurrencyId: string | null;
    minStockLevel: string;
    maxStockLevel: string | null;
    isActive: boolean;
    createdAt: Date;
  }) {
    this.id = params.id;
    this.companyId = params.companyId;
    this.sku = params.sku;
    this.name = params.name;
    this.description = params.description;
    this.baseUnitId = params.baseUnitId;
    this.categoryId = params.categoryId;
    this.defaultCurrencyId = params.defaultCurrencyId;
    this.minStockLevel = params.minStockLevel;
    this.maxStockLevel = params.maxStockLevel;
    this.isActive = params.isActive;
    this.createdAt = params.createdAt;
  }

  deactivate(): void {
    this.isActive = false;
  }
}
