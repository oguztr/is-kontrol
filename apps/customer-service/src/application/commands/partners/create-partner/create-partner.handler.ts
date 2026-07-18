import { PartnerEntity } from "../../../../domain/entities/partner.entity";
import { PartnerActivityEntity } from "../../../../domain/entities/partner-activity.entity";
import { PartnerErrors } from "../../../../domain/errors/partner.errors";
import type { PartnerError } from "../../../../domain/errors/partner.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IPartnerActivityRepository } from "../../../../domain/repositories/partner-activity.repository.interface";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { partnerSnapshotPayload } from "../partner-command.base";
import { CreatePartnerCommand } from "./create-partner.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class CreatePartnerHandler {
  constructor(
    private readonly partners: IPartnerRepository,
    private readonly activities: IPartnerActivityRepository,
    private readonly companyReferences: ICompanyReferenceRepository,
    private readonly eventPublisher: IEventPublisherPort,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: CreatePartnerCommand,
  ): Promise<Result<{ id: string }, PartnerError>> {
    const outcome = await this.unitOfWork.run<{ id: string } | PartnerError>(
      async () => {
        // Şirket izolasyonu: aktör yalnızca kendi şirketi adına kayıt açabilir.
        if (!this.actor.allowsCompany(command.companyId)) {
          return PartnerErrors.companyNotFound(command.companyId);
        }
        // Reference (cache) tablolara hard FK yok; bütünlük burada doğrulanır.
        const company = await this.companyReferences.findById(command.companyId);
        if (!company) return PartnerErrors.companyNotFound(command.companyId);
        if (!company.isActive) return PartnerErrors.companyInactive(command.companyId);

        const partner = new PartnerEntity({
          id: crypto.randomUUID(),
          companyId: command.companyId,
          name: command.name,
          type: command.type,
          kind: command.kind,
          status: "ACTIVE",
          // Satış hunisi yalnız müşteri yüzü olan tiplerde başlar (LEAD).
          salesFunnelStage: command.type === "SUPPLIER" ? null : "LEAD",
          assignedUserId: command.assignedUserId,
          tags: [...new Set(command.tags)],
          mergedIntoId: null,
          // Kimliği doğrulanmış kullanıcı (x-user-id) body'deki değere yeğlenir.
          createdBy: this.actor.userId() ?? command.createdBy,
          createdAt: new Date(),
          deletedAt: null,
        });
        await this.partners.save(partner);

        await this.activities.save(
          new PartnerActivityEntity({
            id: crypto.randomUUID(),
            partnerId: partner.id,
            kind: "PARTNER_CREATED",
            detail: { type: partner.type, kind: partner.kind },
            actorUserId: this.actor.userId(),
            createdAt: new Date(),
          }),
        );

        await this.eventPublisher.publish({
          aggregateType: "Partner",
          aggregateId: partner.id,
          eventType: "partner.created",
          payload: partnerSnapshotPayload(partner),
        });

        return { id: partner.id };
      },
    );
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }
}
