import type { IUnitOfWorkPort } from '../../../application/ports/unit-of-work.port'
import type { WriteDb } from './drizzle.provider'

export class DrizzleUnitOfWork implements IUnitOfWorkPort {
  constructor(private readonly db: WriteDb) {}

  async run<T>(work: () => Promise<T>): Promise<T> {
    return this.db.transaction(async () => work());
  }
}
