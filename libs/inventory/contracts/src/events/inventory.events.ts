import type { StockMovementType } from '../dtos/stock-movement.dto.js';

export interface StockCreatedEvent {
  productId: string;
  warehouseId: string;
  quantity: number;
  occurredAt: string;
}

export interface StockMovedEvent {
  productId: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number;
  referenceId: string;
  occurredAt: string;
}

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

export interface ProductCreatedEvent {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  unit: string;
  occurredAt: string;
}
