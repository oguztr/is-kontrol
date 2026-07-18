import type { PartnerError } from "../../../../domain/errors/partner.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IPartnerActivityRepository } from "../../../../domain/repositories/partner-activity.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { PartnerCommandHandlerBase } from "../partner-command.base";
import { AssignPartnerCommand } from "./assign-partner.command";
import { Result } from "@is-kontrol/shared-result";

export class AssignPartnerHandler extends PartnerCommandHandlerBase {
  constructor(
    partners: IPartnerRepository,
    activities: IPartnerActivityRepository,
    eventPublisher: IEventPublisherPort,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
  ) {
    super(partners, activities, eventPublisher, unitOfWork, actor);
  }

  async execute(command: AssignPartnerCommand): Promise<Result<void, PartnerError>> {
    return this.mutatePartner(command.partnerId, async (partner) => {
      if (partner.assignedUserId === command.assignedUserId) return undefined;
      const previousUserId = partner.assignedUserId;
      partner.assignedUserId = command.assignedUserId;
      await this.partners.update(partner);
      await this.recordActivity(partner.id, "REPRESENTATIVE_ASSIGNED", {
        assignedUserId: { from: previousUserId, to: command.assignedUserId },
      });
      return undefined;
    });
  }
}
