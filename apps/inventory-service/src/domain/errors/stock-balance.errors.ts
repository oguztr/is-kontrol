export type StockBalanceError =
  | { code: 'COMPANY_NOT_FOUND'; companyId: string }
  | { code: 'PRODUCT_NOT_FOUND'; productId: string }
  | { code: 'WAREHOUSE_NOT_FOUND'; warehouseId: string };

export const StockBalanceErrors = {
  companyNotFound: (companyId: string): StockBalanceError =>
    ({ code: 'COMPANY_NOT_FOUND', companyId }),

  productNotFound: (productId: string): StockBalanceError =>
    ({ code: 'PRODUCT_NOT_FOUND', productId }),

  warehouseNotFound: (warehouseId: string): StockBalanceError =>
    ({ code: 'WAREHOUSE_NOT_FOUND', warehouseId }),
};
