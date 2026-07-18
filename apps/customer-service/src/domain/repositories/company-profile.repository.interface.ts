import type { CompanyProfileEntity } from "../entities/company-profile.entity";

export interface TaxNumberDuplicate {
  taxNumber: string;
  partnerIds: string[];
}

export interface ICompanyProfileRepository {
  findByPartnerId(partnerId: string): Promise<CompanyProfileEntity | null>;
  save(profile: CompanyProfileEntity): Promise<void>;
  update(profile: CompanyProfileEntity): Promise<void>;
  moveToPartner(profileId: string, partnerId: string): Promise<void>;
  deleteByPartnerId(partnerId: string): Promise<void>;
  /** Aynı vergi numarasını paylaşan partner grupları (mükerrer adayları). */
  listTaxNumberDuplicates(companyId: string): Promise<TaxNumberDuplicate[]>;
}
