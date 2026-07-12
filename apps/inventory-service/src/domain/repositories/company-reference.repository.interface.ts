export interface CompanyReference {
  id: string;
  name: string;
  baseCurrencyCode: string;
  isActive: boolean;
  syncedAt: Date;
}

export interface ICompanyReferenceRepository {
  findById(id: string): Promise<CompanyReference | null>;
  upsert(reference: CompanyReference): Promise<void>;
  setActive(id: string, isActive: boolean, syncedAt: Date): Promise<void>;
}
