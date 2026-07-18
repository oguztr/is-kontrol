import { PartnerErrors } from "../../../../domain/errors/partner.errors";
import type { PartnerError } from "../../../../domain/errors/partner.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IPartnerActivityRepository } from "../../../../domain/repositories/partner-activity.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { PartnerCommandHandlerBase } from "../partner-command.base";
import { ExpandPartnerTypeCommand } from "./expand-partner-type.command";
import { Result } from "@is-kontrol/shared-result";

/* Tip yalnızca genişletilebilir (CUSTOMER→BOTH, SUPPLIER→BOTH): var olan bir
 * müşteri aynı zamanda tedarikçi olur, kayıt silinip yeniden oluşturulmaz.
 * Daraltma, tüketen servislerdeki referansları bozacağı için reddedilir. */
export class ExpandPartnerTypeHandler extends PartnerCommandHandlerBase {
  constructor(
    partners: IPartnerRepository,
    activities: IPartnerActivityRepository,
    eventPublisher: IEventPublisherPort,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
  ) {
    super(partners, activities, eventPublisher, unitOfWork, actor);
  }

  async execute(command: ExpandPartnerTypeCommand): Promise<Result<void, PartnerError>> {
    return this.mutatePartner(command.partnerId, async (partner) => {
      if (!partner.canExpandTo(command.type)) {
        return PartnerErrors.typeNarrowingNotAllowed(
          partner.id,
          partner.type,
          command.type,
        );
      }
      const previousType = partner.type;
      partner.expandTo(command.type);
      // Yeni kazanılan müşteri yüzü satış hunisine LEAD olarak girer.
      if (partner.isCustomerFacing && !partner.salesFunnelStage) {
        partner.salesFunnelStage = "LEAD";
      }
      await this.partners.update(partner);
      await this.recordActivity(partner.id, "TYPE_EXPANDED", {
        type: { from: previousType, to: partner.type },
      });
      await this.publishPartnerEvent(partner, "partner.type-changed");
      return undefined;
    });
  }
}
