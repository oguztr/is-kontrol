export interface BusinessPartnerReference {
  id: string;
  companyId: string;
  name: string;
  type: 'SUPPLIER' | 'CUSTOMER' | 'BOTH';
  isActive: boolean;
  syncedAt: Date;
}

export interface IBusinessPartnerReferenceRepository {
  findById(id: string): Promise<BusinessPartnerReference | null>;
  upsert(reference: BusinessPartnerReference): Promise<void>;
  setActive(id: string, isActive: boolean, syncedAt: Date): Promise<void>;
}
