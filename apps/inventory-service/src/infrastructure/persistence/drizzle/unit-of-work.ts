import type { IUnitOfWorkPort } from '../../../application/ports/unit-of-work.port'
import { OptimisticLockError } from '../../../domain/errors/optimistic-lock.error'
import type { DrizzleTransactionHost } from './drizzle.provider'

// Postgres'in "yeniden dene" dediği durumlar: serialization_failure (40001)
// ve deadlock_detected (40P01).
const RETRYABLE_PG_CODES = new Set(['40001', '40P01']);
const MAX_ATTEMPTS = 3;

export class DrizzleUnitOfWork implements IUnitOfWorkPort {
  constructor(private readonly session: DrizzleTransactionHost) {}

  /* Serileştirme/deadlock hataları ve optimistic kilit çakışmalarında
   * transaction baştan denenir; iş yükü closure olduğu için her denemede
   * güncel durumu yeniden okur. İç içe çağrıda retry yapılmaz: dıştaki
   * transaction PG tarafında zaten iptal edilmiştir, tekrar dışarıdan gelir. */
  async run<T>(work: () => Promise<T>): Promise<T> {
    if (this.session.inTransaction) {
      return this.session.runInTransaction(work);
    }
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        return await this.session.runInTransaction(work);
      } catch (error) {
        if (!this.isRetryable(error) || attempt === MAX_ATTEMPTS) {
          throw error;
        }
        lastError = error;
        await this.backoff(attempt);
      }
    }
    throw lastError;
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof OptimisticLockError) return true;
    const code = (error as { code?: unknown } | null)?.code;
    return typeof code === 'string' && RETRYABLE_PG_CODES.has(code);
  }

  private backoff(attempt: number): Promise<void> {
    // Küçük, artan ve jitter'lı bekleme: çakışan transaction'ları ayrıştırır.
    const delay = attempt * 50 + Math.floor(Math.random() * 50);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
