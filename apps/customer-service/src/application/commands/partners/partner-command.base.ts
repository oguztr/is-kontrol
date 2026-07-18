import type { PartnerEntity } from "../../../domain/entities/partner.entity";
import { PartnerActivityEntity } from "../../../domain/entities/partner-activity.entity";
import type { PartnerActivityKind } from "../../../domain/entities/partner-activity.entity";
import { PartnerErrors } from "../../../domain/errors/partner.errors";
import type { PartnerError } from "../../../domain/errors/partner.errors";
import type { IPartnerRepository } from "../../../domain/repositories/partner.repository.interface";
import type { IPartnerActivityRepository } from "../../../domain/repositories/partner-activity.repository.interface";
import type { IEventPublisherPort } from "../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../ports/actor-context.port";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/** Tüketen servislerin (ör. inventory) reference cache'ini besleyen anlık görüntü. */
export function partnerSnapshotPayload(
  partner: PartnerEntity,
): Record<string, unknown> {
  return {
    id: partner.id,
    companyId: partner.companyId,
    name: partner.name,
    type: partner.type,
    isActive: partner.isActive,
    occurredAt: new Date().toISOString(),
  };
}

/* Partner'ı kilitleyip değiştiren command handler'ların ortak gövdesi:
 * kapsam kontrolü, aktivite kaydı ve event yayını tek yerde toplanır. */
export abstract class PartnerCommandHandlerBase {
  protected constructor(
    protected readonly partners: IPartnerRepository,
    protected readonly activities: IPartnerActivityRepository,
    protected readonly eventPublisher: IEventPublisherPort,
    protected readonly unitOfWork: IUnitOfWorkPort,
    protected readonly actor: IActorContextPort,
  ) {}

  protected async mutatePartner(
    id: string,
    change: (partner: PartnerEntity) => Promise<PartnerError | undefined>,
  ): Promise<Result<void, PartnerError>> {
    const error = await this.unitOfWork.run<PartnerError | undefined>(
      async () => {
        const partner = await this.partners.findByIdForUpdate(id);
        if (!partner || !this.actor.allowsCompany(partner.companyId))
          return PartnerErrors.notFound(id);
        return change(partner);
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }

  protected async recordActivity(
    partnerId: string,
    kind: PartnerActivityKind,
    detail: Record<string, unknown>,
  ): Promise<void> {
    await this.activities.save(
      new PartnerActivityEntity({
        id: crypto.randomUUID(),
        partnerId,
        kind,
        detail,
        actorUserId: this.actor.userId(),
        createdAt: new Date(),
      }),
    );
  }

  protected async publishPartnerEvent(
    partner: PartnerEntity,
    eventType: string,
    payload: Record<string, unknown> = partnerSnapshotPayload(partner),
  ): Promise<void> {
    await this.eventPublisher.publish({
      aggregateType: "Partner",
      aggregateId: partner.id,
      eventType,
      payload,
    });
  }
}
