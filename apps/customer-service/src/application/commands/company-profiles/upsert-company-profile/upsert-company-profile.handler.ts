import { CompanyProfileEntity } from "../../../../domain/entities/company-profile.entity";
import { PartnerErrors } from "../../../../domain/errors/partner.errors";
import type { PartnerError } from "../../../../domain/errors/partner.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { ICompanyProfileRepository } from "../../../../domain/repositories/company-profile.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { UpsertCompanyProfileCommand } from "./upsert-company-profile.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

/* Firma bilgisi yalnızca KURUMSAL partnerde tutulur; oluştur/güncelle tek
 * uçta toplanır (1:1 ilişki). Holding zinciri döngüye karşı doğrulanır. */
export class UpsertCompanyProfileHandler {
  constructor(
    private readonly partners: IPartnerRepository,
    private readonly companyProfiles: ICompanyProfileRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: UpsertCompanyProfileCommand,
  ): Promise<Result<{ id: string }, PartnerError>> {
    const outcome = await this.unitOfWork.run<{ id: string } | PartnerError>(
      async () => {
        const partner = await this.partners.findByIdForUpdate(command.partnerId);
        if (!partner || !this.actor.allowsCompany(partner.companyId)) {
          return PartnerErrors.notFound(command.partnerId);
        }
        if (partner.kind !== "CORPORATE") {
          return PartnerErrors.notCorporate(partner.id);
        }

        if (command.parentPartnerId) {
          const parentError = await this.validateParent(
            partner.id,
            partner.companyId,
            command.parentPartnerId,
          );
          if (parentError) return parentError;
        }

        const existing = await this.companyProfiles.findByPartnerId(partner.id);
        if (existing) {
          existing.tradeName = command.tradeName;
          existing.taxNumber = command.taxNumber;
          existing.taxOffice = command.taxOffice;
          existing.industry = command.industry;
          existing.website = command.website;
          existing.parentPartnerId = command.parentPartnerId;
          existing.paymentTermDays = command.paymentTermDays;
          existing.preferredCurrencyCode = command.preferredCurrencyCode;
          await this.companyProfiles.update(existing);
          return { id: existing.id };
        }

        const profile = new CompanyProfileEntity({
          id: crypto.randomUUID(),
          partnerId: partner.id,
          tradeName: command.tradeName,
          taxNumber: command.taxNumber,
          taxOffice: command.taxOffice,
          industry: command.industry,
          website: command.website,
          parentPartnerId: command.parentPartnerId,
          paymentTermDays: command.paymentTermDays,
          preferredCurrencyCode: command.preferredCurrencyCode,
          createdAt: new Date(),
        });
        await this.companyProfiles.save(profile);
        return { id: profile.id };
      },
    );
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }

  /* Üst firma aynı şirkette, kurumsal ve döngüsüz olmalı: parent zinciri
   * yürünürken bu partnere geri dönülüyorsa holding ilişkisi kurulamaz. */
  private async validateParent(
    partnerId: string,
    companyId: string,
    parentPartnerId: string,
  ): Promise<PartnerError | undefined> {
    if (parentPartnerId === partnerId) {
      return PartnerErrors.parentCycle(partnerId);
    }
    const parent = await this.partners.findById(parentPartnerId);
    if (!parent || parent.companyId !== companyId || parent.kind !== "CORPORATE") {
      return PartnerErrors.parentNotFound(parentPartnerId);
    }
    const visited = new Set<string>([partnerId]);
    let currentId: string | null = parentPartnerId;
    while (currentId) {
      if (visited.has(currentId)) return PartnerErrors.parentCycle(partnerId);
      visited.add(currentId);
      const profile = await this.companyProfiles.findByPartnerId(currentId);
      currentId = profile?.parentPartnerId ?? null;
    }
    return undefined;
  }
}
