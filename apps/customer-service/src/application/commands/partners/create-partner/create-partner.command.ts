import type { PartnerKind, PartnerType } from "../../../../domain/entities/partner.entity";

export class CreatePartnerCommand {
  constructor(
    public readonly companyId: string,
    public readonly name: string,
    public readonly type: PartnerType,
    public readonly kind: PartnerKind,
    public readonly assignedUserId: string | null,
    public readonly tags: string[],
    public readonly createdBy: string | null,
  ) {}
}
