export type StockDocumentError =
  | { code: 'DOCUMENT_NOT_FOUND'; documentId: string }
  | { code: 'DOCUMENT_ALREADY_POSTED'; documentId: string }
  | { code: 'DOCUMENT_ALREADY_CANCELLED'; documentId: string }
  | { code: 'DOCUMENT_NUMBER_ALREADY_EXISTS'; companyId: string; documentNumber: string }
  | { code: 'DOCUMENT_HAS_NO_LINES'; documentId: string }
  | { code: 'INSUFFICIENT_STOCK'; productId: string; warehouseId: string; requested: string; available: string }
  | { code: 'INVALID_UNIT_CONVERSION'; fromUnitId: string; toUnitId: string };

export const StockDocumentErrors = {
  notFound: (documentId: string): StockDocumentError =>
    ({ code: 'DOCUMENT_NOT_FOUND', documentId }),

  alreadyPosted: (documentId: string): StockDocumentError =>
    ({ code: 'DOCUMENT_ALREADY_POSTED', documentId }),

  alreadyCancelled: (documentId: string): StockDocumentError =>
    ({ code: 'DOCUMENT_ALREADY_CANCELLED', documentId }),

  documentNumberAlreadyExists: (companyId: string, documentNumber: string): StockDocumentError =>
    ({ code: 'DOCUMENT_NUMBER_ALREADY_EXISTS', companyId, documentNumber }),

  hasNoLines: (documentId: string): StockDocumentError =>
    ({ code: 'DOCUMENT_HAS_NO_LINES', documentId }),

  insufficientStock: (
    params: Omit<Extract<StockDocumentError, { code: 'INSUFFICIENT_STOCK' }>, 'code'>,
  ): StockDocumentError =>
    ({ code: 'INSUFFICIENT_STOCK', ...params }),

  invalidUnitConversion: (fromUnitId: string, toUnitId: string): StockDocumentError =>
    ({ code: 'INVALID_UNIT_CONVERSION', fromUnitId, toUnitId }),
};
