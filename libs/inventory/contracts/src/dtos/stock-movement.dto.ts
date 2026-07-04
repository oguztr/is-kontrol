export type StockMovementType = 'IN' | 'OUT' | 'ADJUST' | 'RESERVE' | 'RELEASE';

export interface StockMovementDto {
  productId: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number;
  referenceType: string;
  referenceId: string;
}
