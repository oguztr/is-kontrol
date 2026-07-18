import type { PartnerError } from "../../../../domain/errors/partner.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IPartnerActivityRepository } from "../../../../domain/repositories/partner-activity.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { PartnerCommandHandlerBase } from "../partner-command.base";
import { ChangePartnerStatusCommand } from "./change-partner-status.command";
import { Result } from "@is-kontrol/shared-result";

export class ChangePartnerStatusHandler extends PartnerCommandHandlerBase {
  constructor(
    partners: IPartnerRepository,
    activities: IPartnerActivityRepository,
    eventPublisher: IEventPublisherPort,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
  ) {
    super(partners, activities, eventPublisher, unitOfWork, actor);
  }

  async execute(command: ChangePartnerStatusCommand): Promise<Result<void, PartnerError>> {
    return this.mutatePartner(command.partnerId, async (partner) => {
      if (partner.status === command.status) return undefined;
      const previousStatus = partner.status;
      partner.status = command.status;
      await this.partners.update(partner);
      await this.recordActivity(partner.id, "STATUS_CHANGED", {
        status: { from: previousStatus, to: partner.status },
      });
      // Özellikle BLACKLISTED geçişinde Sales/Purchasing aksiyon alabilir.
      await this.publishPartnerEvent(partner, "partner.status-changed", {
        id: partner.id,
        companyId: partner.companyId,
        status: partner.status,
        isActive: partner.isActive,
        occurredAt: new Date().toISOString(),
      });
      return undefined;
    });
  }
}
