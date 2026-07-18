import { PartnerErrors } from "../../../../domain/errors/partner.errors";
import type { PartnerError } from "../../../../domain/errors/partner.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IPartnerActivityRepository } from "../../../../domain/repositories/partner-activity.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { PartnerCommandHandlerBase } from "../partner-command.base";
import { UpdateSalesFunnelStageCommand } from "./update-sales-funnel-stage.command";
import { Result } from "@is-kontrol/shared-result";

/* LEAD → PROSPECT → CUSTOMER hunisi yalnızca müşteri yüzü olan (CUSTOMER/BOTH)
 * partnerlerde anlamlıdır; bir tedarikçi "lead" olamaz. */
export class UpdateSalesFunnelStageHandler extends PartnerCommandHandlerBase {
  constructor(
    partners: IPartnerRepository,
    activities: IPartnerActivityRepository,
    eventPublisher: IEventPublisherPort,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
  ) {
    super(partners, activities, eventPublisher, unitOfWork, actor);
  }

  async execute(command: UpdateSalesFunnelStageCommand): Promise<Result<void, PartnerError>> {
    return this.mutatePartner(command.partnerId, async (partner) => {
      if (!partner.isCustomerFacing) {
        return PartnerErrors.salesFunnelNotApplicable(partner.id, partner.type);
      }
      if (partner.salesFunnelStage === command.stage) return undefined;
      const previousStage = partner.salesFunnelStage;
      partner.salesFunnelStage = command.stage;
      await this.partners.update(partner);
      await this.recordActivity(partner.id, "STAGE_CHANGED", {
        salesFunnelStage: { from: previousStage, to: command.stage },
      });
      return undefined;
    });
  }
}
