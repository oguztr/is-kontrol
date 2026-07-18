import type { PartnerError } from "../../../../domain/errors/partner.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IPartnerActivityRepository } from "../../../../domain/repositories/partner-activity.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { PartnerCommandHandlerBase } from "../partner-command.base";
import { UpdatePartnerCommand } from "./update-partner.command";
import { Result } from "@is-kontrol/shared-result";

export class UpdatePartnerHandler extends PartnerCommandHandlerBase {
  constructor(
    partners: IPartnerRepository,
    activities: IPartnerActivityRepository,
    eventPublisher: IEventPublisherPort,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
  ) {
    super(partners, activities, eventPublisher, unitOfWork, actor);
  }

  async execute(command: UpdatePartnerCommand): Promise<Result<void, PartnerError>> {
    return this.mutatePartner(command.partnerId, async (partner) => {
      const previousName = partner.name;
      partner.name = command.name;
      await this.partners.update(partner);
      if (previousName !== command.name) {
        await this.recordActivity(partner.id, "PARTNER_UPDATED", {
          name: { from: previousName, to: command.name },
        });
      }
      await this.publishPartnerEvent(partner, "partner.updated");
      return undefined;
    });
  }
}
