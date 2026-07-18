import type { PartnerEntity, PartnerStatus, PartnerType, SalesFunnelStage } from "../entities/partner.entity";

export interface PartnerListFilter {
  companyId: string;
  type?: PartnerType;
  status?: PartnerStatus;
  salesFunnelStage?: SalesFunnelStage;
  assignedUserId?: string;
  tag?: string;
  createdFrom?: Date;
  createdTo?: Date;
  /** Global arama: partner adı, firma unvanı, kişi e-posta/telefonu. */
  search?: string;
}

export interface IPartnerRepository {
  findById(id: string): Promise<PartnerEntity | null>;
  findByIdForUpdate(id: string): Promise<PartnerEntity | null>;
  save(partner: PartnerEntity): Promise<void>;
  update(partner: PartnerEntity): Promise<void>;
  list(filter: PartnerListFilter): Promise<PartnerEntity[]>;
}
