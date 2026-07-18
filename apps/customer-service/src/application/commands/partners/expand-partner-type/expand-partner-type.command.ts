import type { PartnerType } from "../../../../domain/entities/partner.entity";

export class ExpandPartnerTypeCommand {
  constructor(
    public readonly partnerId: string,
    public readonly type: PartnerType,
  ) {}
}
