export interface CurrencyReference {
  id: string;
  code: string;
  name: string;
  decimalPlaces: number;
  isActive: boolean;
  syncedAt: Date;
}

export interface ICurrencyReferenceRepository {
  findById(id: string): Promise<CurrencyReference | null>;
  findByCode(code: string): Promise<CurrencyReference | null>;
  upsert(reference: CurrencyReference): Promise<void>;
}
