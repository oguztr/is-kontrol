import type { PartnerStatus } from "../../../../domain/entities/partner.entity";

export class ChangePartnerStatusCommand {
  constructor(
    public readonly partnerId: string,
    public readonly status: PartnerStatus,
  ) {}
}
