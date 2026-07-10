import type { StockMovementEntity } from '../entities/stock-movement.entity'

export interface IStockMovementRepository {
  findByDocumentId(documentId: string): Promise<StockMovementEntity[]>;
  saveMany(movements: StockMovementEntity[]): Promise<void>;
}
