import type { ContactEntity } from "../entities/contact.entity";

export interface ContactSearchFilter {
  companyId: string;
  phone?: string;
  email?: string;
}

export interface EmailDuplicate {
  email: string;
  partnerIds: string[];
}

export interface IContactRepository {
  findById(id: string): Promise<ContactEntity | null>;
  listByPartner(partnerId: string): Promise<ContactEntity[]>;
  save(contact: ContactEntity): Promise<void>;
  update(contact: ContactEntity): Promise<void>;
  delete(id: string): Promise<void>;
  /** Partnerin mevcut birincil kişisini (varsa) birincillikten düşürür. */
  clearPrimary(partnerId: string): Promise<void>;
  search(filter: ContactSearchFilter): Promise<ContactEntity[]>;
  reassignPartner(fromPartnerId: string, toPartnerId: string): Promise<void>;
  /** Aynı e-postayı paylaşan partner grupları (mükerrer adayları). */
  listEmailDuplicates(companyId: string): Promise<EmailDuplicate[]>;
}
