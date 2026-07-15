import type { StockBalanceEntity } from '../entities/stock-balance.entity'

/** Eşik ihlali: bakiye, ürün kartındaki min/max seviyeye göre sınır dışında. */
export interface StockLevelBreach {
  productId: string;
  warehouseId: string;
  quantity: string;
  threshold: string;
}

export interface OutOfStockProduct {
  productId: string;
  sku: string;
  name: string;
}

/** Şirket geneli stok toplamları (bakiyesi olan tüm depo-ürünler üzerinden). */
export interface CompanyStockTotals {
  productCount: number;
  totalQuantity: string;
  totalValue: string;
}

/** Ürün bazında değerleme satırı; averageCost miktar ağırlıklı ortalamadır. */
export interface ProductValuationRow {
  productId: string;
  sku: string;
  name: string;
  totalQuantity: string;
  averageCost: string;
  totalValue: string;
}

export interface IStockBalanceRepository {
  findByWarehouseAndProduct(warehouseId: string, productId: string): Promise<StockBalanceEntity | null>;
  listByWarehouse(warehouseId: string): Promise<StockBalanceEntity[]>;
  listByProduct(productId: string): Promise<StockBalanceEntity[]>;
  /** Tanımlı (sıfırdan büyük) minimum seviyenin altına düşen bakiyeler. */
  listBelowMinimum(companyId: string): Promise<StockLevelBreach[]>;
  /** Tanımlı maksimum seviyeyi aşan bakiyeler. */
  listAboveMaximum(companyId: string): Promise<StockLevelBreach[]>;
  /** Toplam stoğu sıfır olan (veya hiç bakiyesi olmayan) silinmemiş ürünler. */
  listOutOfStockProducts(companyId: string): Promise<OutOfStockProduct[]>;
  listNegative(companyId: string): Promise<StockBalanceEntity[]>;
  companySummary(companyId: string): Promise<CompanyStockTotals>;
  valuation(companyId: string, warehouseId?: string): Promise<ProductValuationRow[]>;
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
