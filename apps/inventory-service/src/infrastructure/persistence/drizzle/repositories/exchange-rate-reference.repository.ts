import { lte } from "drizzle-orm";
import type {
  ExchangeRateReference,
  IExchangeRateReferenceRepository,
} from "../../../../domain/repositories/exchange-rate-reference.repository.interface";
import type { DbExecutor, DrizzleTransactionHost } from "../drizzle.provider";
import { exchangeRateReferences } from "../schema";

export class DrizzleExchangeRateReferenceRepository
  implements IExchangeRateReferenceRepository
{
  constructor(private readonly session: DrizzleTransactionHost) {}
  private get db(): DbExecutor { return this.session.db; }

  async upsert(reference: ExchangeRateReference): Promise<void> {
    await this.db.insert(exchangeRateReferences).values(reference)
      .onConflictDoUpdate({
        target: [exchangeRateReferences.companyId, exchangeRateReferences.currencyCode],
        set: {
          rate: reference.rate,
          effectiveAt: reference.effectiveAt,
          syncedAt: reference.syncedAt,
        },
        setWhere: lte(exchangeRateReferences.syncedAt, reference.syncedAt),
      });
  }
}
