export type ProductError =
  | { code: 'COMPANY_NOT_FOUND'; companyId: string }
  | { code: 'COMPANY_INACTIVE'; companyId: string }
  | { code: 'BASE_UNIT_NOT_FOUND'; unitId: string }
  | { code: 'CATEGORY_NOT_FOUND'; categoryId: string }
  | { code: 'CURRENCY_NOT_FOUND'; currencyId: string }
  | { code: 'INVALID_STOCK_LEVEL_RANGE'; min: string; max: string }
  | { code: 'PRODUCT_NOT_FOUND'; productId: string }
  | { code: 'PRODUCT_SKU_ALREADY_EXISTS'; companyId: string; sku: string }
  | { code: 'PRODUCT_INACTIVE'; productId: string }
  | { code: 'INVALID_UNIT_CONVERSION'; fromUnitId: string; toUnitId: string };

export const ProductErrors = {
  companyNotFound: (companyId: string): ProductError =>
    ({ code: 'COMPANY_NOT_FOUND', companyId }),

  companyInactive: (companyId: string): ProductError =>
    ({ code: 'COMPANY_INACTIVE', companyId }),

  baseUnitNotFound: (unitId: string): ProductError =>
    ({ code: 'BASE_UNIT_NOT_FOUND', unitId }),

  categoryNotFound: (categoryId: string): ProductError =>
    ({ code: 'CATEGORY_NOT_FOUND', categoryId }),

  currencyNotFound: (currencyId: string): ProductError =>
    ({ code: 'CURRENCY_NOT_FOUND', currencyId }),

  invalidStockLevelRange: (min: string, max: string): ProductError =>
    ({ code: 'INVALID_STOCK_LEVEL_RANGE', min, max }),

  notFound: (productId: string): ProductError =>
    ({ code: 'PRODUCT_NOT_FOUND', productId }),

  skuAlreadyExists: (companyId: string, sku: string): ProductError =>
    ({ code: 'PRODUCT_SKU_ALREADY_EXISTS', companyId, sku }),

  inactive: (productId: string): ProductError =>
    ({ code: 'PRODUCT_INACTIVE', productId }),

  invalidUnitConversion: (fromUnitId: string, toUnitId: string): ProductError =>
    ({ code: 'INVALID_UNIT_CONVERSION', fromUnitId, toUnitId }),
};
