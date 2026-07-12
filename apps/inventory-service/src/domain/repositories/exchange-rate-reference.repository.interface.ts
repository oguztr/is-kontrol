export interface ExchangeRateReference {
  id: string;
  companyId: string;
  currencyCode: string;
  rate: string;
  effectiveAt: Date;
  syncedAt: Date;
}

export interface IExchangeRateReferenceRepository {
  upsert(reference: ExchangeRateReference): Promise<void>;
}
