import type { IUnitOfWorkPort } from '../../../application/ports/unit-of-work.port'
import type { DrizzleTransactionHost } from './drizzle.provider'

export class DrizzleUnitOfWork implements IUnitOfWorkPort {
  constructor(private readonly session: DrizzleTransactionHost) {}

  async run<T>(work: () => Promise<T>): Promise<T> {
    return this.session.runInTransaction(work);
  }
}
