export class ProductEntity {
  public readonly id: string;
  public readonly companyId: string;
  public readonly sku: string;
  public barcode: string | null;
  public name: string;
  public description: string | null;
  public baseUnitId: string;
  public categoryId: string | null;
  public defaultCurrencyId: string | null;
  public minStockLevel: string;
  public maxStockLevel: string | null;
  public isActive: boolean;
  public readonly createdAt: Date;
  public archivedAt: Date | null;
  public deletedAt: Date | null;

  constructor(params: {
    id: string;
    companyId: string;
    sku: string;
    barcode?: string | null;
    name: string;
    description: string | null;
    baseUnitId: string;
    categoryId: string | null;
    defaultCurrencyId: string | null;
    minStockLevel: string;
    maxStockLevel: string | null;
    isActive: boolean;
    createdAt: Date;
    archivedAt?: Date | null;
    deletedAt?: Date | null;
  }) {
    this.id = params.id;
    this.companyId = params.companyId;
    this.sku = params.sku;
    this.barcode = params.barcode ?? null;
    this.name = params.name;
    this.description = params.description;
    this.baseUnitId = params.baseUnitId;
    this.categoryId = params.categoryId;
    this.defaultCurrencyId = params.defaultCurrencyId;
    this.minStockLevel = params.minStockLevel;
    this.maxStockLevel = params.maxStockLevel;
    this.isActive = params.isActive;
    this.createdAt = params.createdAt;
    this.archivedAt = params.archivedAt ?? null;
    this.deletedAt = params.deletedAt ?? null;
  }

  deactivate(): void {
    this.isActive = false;
  }

  activate(): void { this.isActive = true; }
  update(name: string, description: string | null, barcode: string | null,
    categoryId: string | null, defaultCurrencyId: string | null): void {
    this.name = name; this.description = description; this.barcode = barcode;
    this.categoryId = categoryId; this.defaultCurrencyId = defaultCurrencyId;
  }
  archive(at: Date): void { this.archivedAt = at; this.isActive = false; }
  delete(at: Date): void { this.deletedAt = at; this.isActive = false; }
  changeBaseUnit(baseUnitId: string): void { this.baseUnitId = baseUnitId; }
  setStockLevels(minimum: string, maximum: string | null): void {
    this.minStockLevel = minimum; this.maxStockLevel = maximum;
  }
}
