import { HttpException, HttpStatus } from '@nestjs/common';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { Failure, Success } from '@is-kontrol/shared-result';
import {
  InventoryDomainResultInterceptor,
  domainErrorToHttpStatus,
} from './domain-result.interceptor';

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
      HttpStatus.NOT_FOUND,
    ],
    [
      { code: 'LINE_PRODUCT_NOT_FOUND', productId: 'product-id' },
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

describe('InventoryDomainResultInterceptor', () => {
  const interceptor = new InventoryDomainResultInterceptor();
  const context = {} as ExecutionContext;

  function intercept(handlerValue: unknown): Promise<unknown> {
    const next: CallHandler = { handle: () => of(handlerValue) };
    return firstValueFrom(interceptor.intercept(context, next));
  }

  it('unwraps Success into the response body', async () => {
    await expect(intercept(new Success({ id: 'product-id' }))).resolves.toEqual({
      id: 'product-id',
    });
  });

  it('passes non-Result values through untouched', async () => {
    await expect(intercept({ plain: true })).resolves.toEqual({ plain: true });
  });

  it('maps Failure to the configured HTTP status', async () => {
    const error = { code: 'DOCUMENT_NOT_FOUND', documentId: 'document-id' };
    const thrown = await intercept(new Failure(error)).catch((e: unknown) => e);
    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect((thrown as HttpException).getResponse()).toEqual(error);
  });

  it('maps unknown error codes to 500', async () => {
    const thrown = await intercept(new Failure({ code: 'NOT_A_REAL_CODE' })).catch(
      (e: unknown) => e,
    );
    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getStatus()).toBe(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect((thrown as HttpException).getResponse()).toEqual({
      code: 'UNKNOWN_DOMAIN_ERROR',
    });
  });
});
