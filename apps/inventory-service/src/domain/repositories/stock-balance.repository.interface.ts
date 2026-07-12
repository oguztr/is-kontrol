import type { StockBalanceEntity } from '../entities/stock-balance.entity'

export interface IStockBalanceRepository {
  findByWarehouseAndProduct(warehouseId: string, productId: string): Promise<StockBalanceEntity | null>;
  /**
   * Var olan veya henüz oluşmamış bir depo-ürün bakiyesini transaction
   * advisory lock ile serileştirir. Transaction içinde çağrılmalıdır.
   */
  lockWarehouseAndProduct(warehouseId: string, productId: string): Promise<void>;
  /**
   * Satırı transaction bitene kadar kilitleyerek okur (SELECT ... FOR UPDATE).
   * Eşzamanlı post işlemlerinde kayıp güncellemeyi önler; transaction içinde
   * çağrılmalıdır.
   */
  findByWarehouseAndProductForUpdate(warehouseId: string, productId: string): Promise<StockBalanceEntity | null>;
  saveOrUpdate(balance: StockBalanceEntity): Promise<void>;
}
