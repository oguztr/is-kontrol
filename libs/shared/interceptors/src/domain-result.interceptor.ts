import { HttpException, HttpStatus } from '@nestjs/common';
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs/operators';
import type { Observable } from 'rxjs';
import { Result } from '@is-kontrol/shared-result';

/* Controller'dan dönen Result'ı otomatik açar: Success ise değeri response
 * body'si yapar, Failure ise hata kodunu verilen tabloya göre HTTP hatasına
 * çevirir. Servisler kendi kod→durum tablosuyla türetip sınıf seviyesinde
 * `@UseInterceptors(...)` ile kullanır; handler'lar Result'ı olduğu gibi döner. */
export class DomainResultInterceptor implements NestInterceptor {
  constructor(
    private readonly statusByCode: Readonly<Record<string, HttpStatus>>,
  ) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((value) => this.unwrap(value)));
  }

  private unwrap(value: unknown): unknown {
    if (!(value instanceof Result)) {
      return value;
    }
    return value.match(
      (data) => data,
      (error) => {
        throw this.toHttpException(error);
      },
    );
  }

  private toHttpException(error: unknown): HttpException {
    const status = this.statusFor(error);
    if (status === undefined) {
      return new HttpException(
        { code: 'UNKNOWN_DOMAIN_ERROR' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return new HttpException(error as Record<string, unknown>, status);
  }

  private statusFor(error: unknown): HttpStatus | undefined {
    if (
      typeof error !== 'object' ||
      error === null ||
      typeof (error as { code?: unknown }).code !== 'string'
    ) {
      return undefined;
    }
    return this.statusByCode[(error as { code: string }).code];
  }
}
