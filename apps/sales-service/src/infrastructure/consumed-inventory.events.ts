/** Inventory domain event'leri — sales-service tüketici sözleşmesi (modül sınırı). */

export const ConsumedInventoryTopics = {
  STOCK_RESERVED: 'stock.reserved',
  STOCK_RELEASED: 'stock.released',
} as const;

export interface StockReservedEvent {
  productId: string;
  warehouseId: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  occurredAt: string;
}

export interface StockReleasedEvent {
  productId: string;
  warehouseId: string;
  quantity: number;
  referenceId: string;
  occurredAt: string;
}
