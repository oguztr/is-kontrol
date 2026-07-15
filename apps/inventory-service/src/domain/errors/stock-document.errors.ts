export type StockDocumentError =
  | { code: 'COMPANY_NOT_FOUND'; companyId: string }
  | { code: 'COMPANY_INACTIVE'; companyId: string }
  | { code: 'CURRENCY_NOT_FOUND'; currencyId: string }
  | { code: 'CURRENCY_INACTIVE'; currencyId: string }
  | { code: 'DOCUMENT_WAREHOUSE_NOT_FOUND'; warehouseId: string }
  | { code: 'WAREHOUSE_INACTIVE'; warehouseId: string }
  | { code: 'PARTNER_NOT_FOUND'; partnerId: string }
  | { code: 'INVALID_PARTNER_TYPE'; partnerId: string; documentType: string }
  | { code: 'TARGET_WAREHOUSE_REQUIRED'; documentType: string }
  | { code: 'TARGET_WAREHOUSE_MUST_DIFFER'; warehouseId: string }
  | { code: 'LINE_PRODUCT_NOT_FOUND'; productId: string }
  | { code: 'PRODUCT_INACTIVE'; productId: string }
  | { code: 'DOCUMENT_NOT_FOUND'; documentId: string }
  | { code: 'MOVEMENT_NOT_FOUND'; movementId: string }
  | { code: 'DOCUMENT_ALREADY_POSTED'; documentId: string }
  | { code: 'DOCUMENT_ALREADY_CANCELLED'; documentId: string }
  | { code: 'DOCUMENT_NUMBER_ALREADY_EXISTS'; companyId: string; documentNumber: string }
  | { code: 'DOCUMENT_HAS_NO_LINES'; documentId: string }
  | { code: 'LINE_NOT_FOUND'; documentId: string; lineNumber: number }
  | { code: 'OPENING_ALREADY_EXISTS'; productId: string; warehouseId: string }
  | { code: 'PARTNER_REQUIRED'; documentType: string }
  | { code: 'INVALID_EXCHANGE_RATE'; exchangeRate: string }
  | { code: 'INVALID_QUANTITY'; lineNumber: number }
  | { code: 'INVALID_UNIT_PRICE'; lineNumber: number }
  | { code: 'INSUFFICIENT_STOCK'; productId: string; warehouseId: string; requested: string; available: string }
  | { code: 'INVALID_UNIT_CONVERSION'; fromUnitId: string; toUnitId: string }
  | { code: 'AMOUNT_OUT_OF_RANGE'; lineNumber: number }
  | { code: 'BALANCE_OUT_OF_RANGE'; productId: string; warehouseId: string };

export const StockDocumentErrors = {
  companyNotFound: (companyId: string): StockDocumentError =>
    ({ code: 'COMPANY_NOT_FOUND', companyId }),

  companyInactive: (companyId: string): StockDocumentError =>
    ({ code: 'COMPANY_INACTIVE', companyId }),

  currencyNotFound: (currencyId: string): StockDocumentError =>
    ({ code: 'CURRENCY_NOT_FOUND', currencyId }),

  currencyInactive: (currencyId: string): StockDocumentError =>
    ({ code: 'CURRENCY_INACTIVE', currencyId }),

  // Belge gövdesinde referans verilen depo; path ile adreslenen depo için
  // WarehouseErrors.notFound kullanılır (404 yerine 422'ye eşlenir).
  warehouseNotFound: (warehouseId: string): StockDocumentError =>
    ({ code: 'DOCUMENT_WAREHOUSE_NOT_FOUND', warehouseId }),

  warehouseInactive: (warehouseId: string): StockDocumentError =>
    ({ code: 'WAREHOUSE_INACTIVE', warehouseId }),

  partnerNotFound: (partnerId: string): StockDocumentError =>
    ({ code: 'PARTNER_NOT_FOUND', partnerId }),

  invalidPartnerType: (partnerId: string, documentType: string): StockDocumentError =>
    ({ code: 'INVALID_PARTNER_TYPE', partnerId, documentType }),

  targetWarehouseRequired: (documentType: string): StockDocumentError =>
    ({ code: 'TARGET_WAREHOUSE_REQUIRED', documentType }),

  targetWarehouseMustDiffer: (warehouseId: string): StockDocumentError =>
    ({ code: 'TARGET_WAREHOUSE_MUST_DIFFER', warehouseId }),

  // Belge satırında referans verilen ürün; path ile adreslenen ürün için
  // ProductErrors.notFound kullanılır (404 yerine 422'ye eşlenir).
  productNotFound: (productId: string): StockDocumentError =>
    ({ code: 'LINE_PRODUCT_NOT_FOUND', productId }),

  productInactive: (productId: string): StockDocumentError =>
    ({ code: 'PRODUCT_INACTIVE', productId }),

  notFound: (documentId: string): StockDocumentError =>
    ({ code: 'DOCUMENT_NOT_FOUND', documentId }),

  movementNotFound: (movementId: string): StockDocumentError =>
    ({ code: 'MOVEMENT_NOT_FOUND', movementId }),

  alreadyPosted: (documentId: string): StockDocumentError =>
    ({ code: 'DOCUMENT_ALREADY_POSTED', documentId }),

  alreadyCancelled: (documentId: string): StockDocumentError =>
    ({ code: 'DOCUMENT_ALREADY_CANCELLED', documentId }),

  documentNumberAlreadyExists: (companyId: string, documentNumber: string): StockDocumentError =>
    ({ code: 'DOCUMENT_NUMBER_ALREADY_EXISTS', companyId, documentNumber }),

  hasNoLines: (documentId: string): StockDocumentError =>
    ({ code: 'DOCUMENT_HAS_NO_LINES', documentId }),

  lineNotFound: (documentId: string, lineNumber: number): StockDocumentError =>
    ({ code: 'LINE_NOT_FOUND', documentId, lineNumber }),

  openingAlreadyExists: (productId: string, warehouseId: string): StockDocumentError =>
    ({ code: 'OPENING_ALREADY_EXISTS', productId, warehouseId }),

  partnerRequired: (documentType: string): StockDocumentError =>
    ({ code: 'PARTNER_REQUIRED', documentType }),

  invalidExchangeRate: (exchangeRate: string): StockDocumentError =>
    ({ code: 'INVALID_EXCHANGE_RATE', exchangeRate }),

  invalidQuantity: (lineNumber: number): StockDocumentError =>
    ({ code: 'INVALID_QUANTITY', lineNumber }),

  invalidUnitPrice: (lineNumber: number): StockDocumentError =>
    ({ code: 'INVALID_UNIT_PRICE', lineNumber }),

  insufficientStock: (
    params: Omit<Extract<StockDocumentError, { code: 'INSUFFICIENT_STOCK' }>, 'code'>,
  ): StockDocumentError =>
    ({ code: 'INSUFFICIENT_STOCK', ...params }),

  invalidUnitConversion: (fromUnitId: string, toUnitId: string): StockDocumentError =>
    ({ code: 'INVALID_UNIT_CONVERSION', fromUnitId, toUnitId }),

  amountOutOfRange: (lineNumber: number): StockDocumentError =>
    ({ code: 'AMOUNT_OUT_OF_RANGE', lineNumber }),

  balanceOutOfRange: (productId: string, warehouseId: string): StockDocumentError =>
    ({ code: 'BALANCE_OUT_OF_RANGE', productId, warehouseId }),
};
