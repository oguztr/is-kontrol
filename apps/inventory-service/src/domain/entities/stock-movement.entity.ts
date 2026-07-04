export type StockMovementType = 'IN' | 'OUT' | 'ADJUST' | 'RESERVE' | 'RELEASE';

export type StockReferenceType =
  | 'PURCHASE_ORDER'
  | 'SALES_ORDER'
  | 'MANUAL'
  | 'QUOTE';

export class StockMovementEntity {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly warehouseId: string,
    public readonly type: StockMovementType,
    public readonly quantity: number,
    public readonly referenceType: StockReferenceType,
    public readonly referenceId: string,
    public readonly createdAt: Date
  ) {}
}
