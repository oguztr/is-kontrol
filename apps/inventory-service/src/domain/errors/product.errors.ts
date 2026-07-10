export type ProductError =
  | { code: 'PRODUCT_NOT_FOUND'; productId: string }
  | { code: 'PRODUCT_SKU_ALREADY_EXISTS'; companyId: string; sku: string }
  | { code: 'PRODUCT_INACTIVE'; productId: string }
  | { code: 'INVALID_UNIT_CONVERSION'; fromUnitId: string; toUnitId: string };

export const ProductErrors = {
  notFound: (productId: string): ProductError =>
    ({ code: 'PRODUCT_NOT_FOUND', productId }),

  skuAlreadyExists: (companyId: string, sku: string): ProductError =>
    ({ code: 'PRODUCT_SKU_ALREADY_EXISTS', companyId, sku }),

  inactive: (productId: string): ProductError =>
    ({ code: 'PRODUCT_INACTIVE', productId }),

  invalidUnitConversion: (fromUnitId: string, toUnitId: string): ProductError =>
    ({ code: 'INVALID_UNIT_CONVERSION', fromUnitId, toUnitId }),
};
