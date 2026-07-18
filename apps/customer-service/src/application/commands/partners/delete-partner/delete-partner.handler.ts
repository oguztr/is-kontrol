import type { PartnerError } from "../../../../domain/errors/partner.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IPartnerActivityRepository } from "../../../../domain/repositories/partner-activity.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { PartnerCommandHandlerBase } from "../partner-command.base";
import { DeletePartnerCommand } from "./delete-partner.command";
import { Result } from "@is-kontrol/shared-result";

/* Soft delete: kayıt silinmez, deletedAt işaretlenir; geçmiş (not, aktivite,
 * hareket referansları) korunur. Tüketicilere pasifleşme olarak yayınlanır. */
export class DeletePartnerHandler extends PartnerCommandHandlerBase {
  constructor(
    partners: IPartnerRepository,
    activities: IPartnerActivityRepository,
    eventPublisher: IEventPublisherPort,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
  ) {
    super(partners, activities, eventPublisher, unitOfWork, actor);
  }

  async execute(command: DeletePartnerCommand): Promise<Result<void, PartnerError>> {
    return this.mutatePartner(command.partnerId, async (partner) => {
      partner.softDelete();
      await this.partners.update(partner);
      await this.recordActivity(partner.id, "PARTNER_DELETED", {});
      await this.publishPartnerEvent(partner, "partner.deleted", {
        id: partner.id,
        companyId: partner.companyId,
        isActive: false,
        occurredAt: new Date().toISOString(),
      });
      return undefined;
    });
  }
}
