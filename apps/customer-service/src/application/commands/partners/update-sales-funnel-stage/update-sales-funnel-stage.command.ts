import type { SalesFunnelStage } from "../../../../domain/entities/partner.entity";

export class UpdateSalesFunnelStageCommand {
  constructor(
    public readonly partnerId: string,
    public readonly stage: SalesFunnelStage,
  ) {}
}
