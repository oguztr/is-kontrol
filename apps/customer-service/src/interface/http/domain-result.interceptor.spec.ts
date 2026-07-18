import { HttpException, HttpStatus } from '@nestjs/common';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { Failure, Success } from '@is-kontrol/shared-result';
import {
  CustomerDomainResultInterceptor,
  domainErrorToHttpStatus,
} from './domain-result.interceptor';

describe('domainErrorToHttpStatus', () => {
  it.each([
    [{ code: 'PARTNER_NOT_FOUND', partnerId: 'partner-id' }, HttpStatus.NOT_FOUND],
    [{ code: 'COMPANY_NOT_FOUND', companyId: 'company-id' }, HttpStatus.UNPROCESSABLE_ENTITY],
    [
      { code: 'PARTNER_TYPE_NARROWING_NOT_ALLOWED', partnerId: 'p', from: 'BOTH', to: 'CUSTOMER' },
      HttpStatus.CONFLICT,
    ],
    [
      { code: 'SALES_FUNNEL_NOT_APPLICABLE', partnerId: 'p', type: 'SUPPLIER' },
      HttpStatus.CONFLICT,
    ],
    [{ code: 'NOTE_EDIT_FORBIDDEN', noteId: 'note-id' }, HttpStatus.FORBIDDEN],
  ] as const)('maps %o to %s', (error, expectedStatus) => {
    expect(domainErrorToHttpStatus(error)).toBe(expectedStatus);
  });
});

describe('CustomerDomainResultInterceptor', () => {
  const interceptor = new CustomerDomainResultInterceptor();
  const context = {} as ExecutionContext;

  function intercept(handlerValue: unknown): Promise<unknown> {
    const next: CallHandler = { handle: () => of(handlerValue) };
    return firstValueFrom(interceptor.intercept(context, next));
  }

  it('unwraps Success into the response body', async () => {
    await expect(intercept(new Success({ id: 'partner-id' }))).resolves.toEqual({
      id: 'partner-id',
    });
  });

  it('maps Failure to the configured HTTP status', async () => {
    const error = { code: 'PARTNER_NOT_FOUND', partnerId: 'partner-id' };
    const thrown = await intercept(new Failure(error)).catch((e: unknown) => e);
    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect((thrown as HttpException).getResponse()).toEqual(error);
  });
});
