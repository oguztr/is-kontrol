import type { StockBalanceEntity } from '../entities/stock-balance.entity'

export interface IStockBalanceRepository {
  findByWarehouseAndProduct(warehouseId: string, productId: string): Promise<StockBalanceEntity | null>;
  saveOrUpdate(balance: StockBalanceEntity): Promise<void>;
}
