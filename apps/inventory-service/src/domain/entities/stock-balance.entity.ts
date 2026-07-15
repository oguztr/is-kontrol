export class StockBalanceEntity {
  public readonly id: string;
  public readonly companyId: string;
  public readonly warehouseId: string;
  public readonly productId: string;
  public quantity: string;
  public averageCost: string;
  public lastMovementId: string | null;
  /** Optimistic locking sürümü; yazma anında beklenen mevcut sürümdür. */
  public readonly version: number;
  public updatedAt: Date;

  constructor(params: {
    id: string;
    companyId: string;
    warehouseId: string;
    productId: string;
    quantity: string;
    averageCost: string;
    lastMovementId: string | null;
    version?: number;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.companyId = params.companyId;
    this.warehouseId = params.warehouseId;
    this.productId = params.productId;
    this.quantity = params.quantity;
    this.averageCost = params.averageCost;
    this.lastMovementId = params.lastMovementId;
    this.version = params.version ?? 0;
    this.updatedAt = params.updatedAt;
  }

  get totalValue(): string {
    return (parseFloat(this.quantity) * parseFloat(this.averageCost)).toFixed(4);
  }
}
