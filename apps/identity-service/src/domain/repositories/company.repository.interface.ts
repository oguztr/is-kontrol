import type { CompanyEntity } from "../entities/company.entity";

export interface ICompanyRepository {
  findById(id: string): Promise<CompanyEntity | null>;
  findByIdForUpdate(id: string): Promise<CompanyEntity | null>;
  save(company: CompanyEntity): Promise<void>;
  update(company: CompanyEntity): Promise<void>;
}
