export type ProductUnitError =
  | { code: 'PRODUCT_NOT_FOUND'; productId: string }
  | { code: 'PRODUCT_ARCHIVED'; productId: string }
  | { code: 'UNIT_NOT_FOUND'; unitId: string }
  | { code: 'PRODUCT_UNIT_NOT_FOUND'; productUnitId: string }
  | { code: 'PRODUCT_UNIT_ALREADY_EXISTS'; productId: string; unitId: string }
  | { code: 'BASE_UNIT_CANNOT_BE_REMOVED'; productId: string; unitId: string }
  | { code: 'BASE_UNIT_FACTOR_MUST_BE_ONE'; unitId: string };

export const ProductUnitErrors = {
  productNotFound: (productId: string): ProductUnitError =>
    ({ code: 'PRODUCT_NOT_FOUND', productId }),

  productArchived: (productId: string): ProductUnitError =>
    ({ code: 'PRODUCT_ARCHIVED', productId }),

  unitNotFound: (unitId: string): ProductUnitError =>
    ({ code: 'UNIT_NOT_FOUND', unitId }),

  notFound: (productUnitId: string): ProductUnitError =>
    ({ code: 'PRODUCT_UNIT_NOT_FOUND', productUnitId }),

  alreadyExists: (productId: string, unitId: string): ProductUnitError =>
    ({ code: 'PRODUCT_UNIT_ALREADY_EXISTS', productId, unitId }),

  baseUnitCannotBeRemoved: (productId: string, unitId: string): ProductUnitError =>
    ({ code: 'BASE_UNIT_CANNOT_BE_REMOVED', productId, unitId }),

  baseUnitFactorMustBeOne: (unitId: string): ProductUnitError =>
    ({ code: 'BASE_UNIT_FACTOR_MUST_BE_ONE', unitId }),
};
