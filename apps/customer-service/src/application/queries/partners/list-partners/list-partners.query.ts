import type { PartnerKind, PartnerStatus, PartnerType, SalesFunnelStage } from "../../../../domain/entities/partner.entity";

export class ListPartnersQuery {
  constructor(
    public readonly companyId: string,
    public readonly type?: PartnerType,
    public readonly status?: PartnerStatus,
    public readonly salesFunnelStage?: SalesFunnelStage,
    public readonly assignedUserId?: string,
    public readonly tag?: string,
    public readonly createdFrom?: Date,
    public readonly createdTo?: Date,
    /** Global arama: isim, firma unvanı, kişi e-posta/telefonu. */
    public readonly search?: string,
    public readonly kind?: PartnerKind,
  ) {}
}
