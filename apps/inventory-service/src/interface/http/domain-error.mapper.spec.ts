import { HttpStatus } from '@nestjs/common';
import { domainErrorToHttpStatus } from './domain-error.mapper';

describe('domainErrorToHttpStatus', () => {
  it.each([
    [{ code: 'DOCUMENT_NOT_FOUND', documentId: 'document-id' }, HttpStatus.NOT_FOUND],
    [
      { code: 'DOCUMENT_ALREADY_POSTED', documentId: 'document-id' },
      HttpStatus.CONFLICT,
    ],
    [
      {
        code: 'INSUFFICIENT_STOCK',
        productId: 'product-id',
        warehouseId: 'warehouse-id',
        requested: '2',
        available: '1',
      },
      HttpStatus.CONFLICT,
    ],
    [
      { code: 'PRODUCT_NOT_FOUND', productId: 'product-id' },
      HttpStatus.UNPROCESSABLE_ENTITY,
    ],
    [
      {
        code: 'WAREHOUSE_CODE_ALREADY_EXISTS',
        companyId: 'company-id',
        warehouseCode: 'MAIN',
      },
      HttpStatus.CONFLICT,
    ],
  ] as const)('maps %o to %s', (error, expectedStatus) => {
    expect(domainErrorToHttpStatus(error)).toBe(expectedStatus);
  });
});
