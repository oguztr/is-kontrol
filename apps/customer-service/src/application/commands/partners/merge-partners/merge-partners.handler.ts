import { PartnerErrors } from "../../../../domain/errors/partner.errors";
import type { PartnerError } from "../../../../domain/errors/partner.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IPartnerActivityRepository } from "../../../../domain/repositories/partner-activity.repository.interface";
import type { ICompanyProfileRepository } from "../../../../domain/repositories/company-profile.repository.interface";
import type { IContactRepository } from "../../../../domain/repositories/contact.repository.interface";
import type { IAddressRepository } from "../../../../domain/repositories/address.repository.interface";
import type { INoteRepository } from "../../../../domain/repositories/note.repository.interface";
import type { IEventPublisherPort } from "../../../ports/event-publisher.port";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { PartnerCommandHandlerBase, partnerSnapshotPayload } from "../partner-command.base";
import { MergePartnersCommand } from "./merge-partners.command";
import { Result } from "@is-kontrol/shared-result";

/* Mükerrer kayıt birleştirme: kaynak partnerin tüm alt kayıtları (kişi,
 * adres, not, aktivite) hayatta kalana taşınır; tipler birleşir (CUSTOMER +
 * SUPPLIER → BOTH), kaynak soft-delete + mergedIntoId ile kapatılır.
 * Tüketen servisler partner.merged ile eski id → yeni id yönlendirmesi yapar. */
export class MergePartnersHandler extends PartnerCommandHandlerBase {
  constructor(
    partners: IPartnerRepository,
    activities: IPartnerActivityRepository,
    private readonly companyProfiles: ICompanyProfileRepository,
    private readonly contacts: IContactRepository,
    private readonly addresses: IAddressRepository,
    private readonly notes: INoteRepository,
    eventPublisher: IEventPublisherPort,
    unitOfWork: IUnitOfWorkPort,
    actor: IActorContextPort,
  ) {
    super(partners, activities, eventPublisher, unitOfWork, actor);
  }

  async execute(command: MergePartnersCommand): Promise<Result<void, PartnerError>> {
    if (command.survivorPartnerId === command.sourcePartnerId) {
      return this.mutatePartner(command.survivorPartnerId, async () =>
        PartnerErrors.mergeSamePartner(command.survivorPartnerId),
      );
    }
    return this.mutatePartner(command.survivorPartnerId, async (survivor) => {
      const source = await this.partners.findByIdForUpdate(command.sourcePartnerId);
      if (!source || !this.actor.allowsCompany(source.companyId)) {
        return PartnerErrors.mergeSourceNotFound(command.sourcePartnerId);
      }
      if (source.companyId !== survivor.companyId) {
        return PartnerErrors.mergeCompanyMismatch(survivor.id, source.id);
      }

      // Tip birleşimi: farklı tipler BOTH'a genişler; huni aşaması boşsa
      // kaynaktan devralınır, temsilci/etiketlerde hayatta kalan önceliklidir.
      if (survivor.type !== source.type) survivor.expandTo("BOTH");
      if (!survivor.salesFunnelStage && survivor.isCustomerFacing) {
        survivor.salesFunnelStage = source.salesFunnelStage ?? "LEAD";
      }
      for (const tag of source.tags) survivor.addTag(tag);
      if (!survivor.assignedUserId) survivor.assignedUserId = source.assignedUserId;

      // Birincil/varsayılan çakışmalarını önlemek için kaynağınkiler düşürülür.
      await this.contacts.clearPrimary(source.id);
      await this.addresses.clearAllDefaults(source.id);
      await this.contacts.reassignPartner(source.id, survivor.id);
      await this.addresses.reassignPartner(source.id, survivor.id);
      await this.notes.reassignPartner(source.id, survivor.id);
      await this.activities.reassignPartner(source.id, survivor.id);

      // Firma profili: hayatta kalanda yoksa kaynağınki taşınır, varsa
      // kaynağınki bırakılır (çakışan profil verisi manuel değerlendirilir).
      const sourceProfile = await this.companyProfiles.findByPartnerId(source.id);
      if (sourceProfile) {
        const survivorProfile = await this.companyProfiles.findByPartnerId(survivor.id);
        if (survivorProfile) {
          await this.companyProfiles.deleteByPartnerId(source.id);
        } else {
          await this.companyProfiles.moveToPartner(sourceProfile.id, survivor.id);
        }
      }

      source.mergeInto(survivor.id);
      await this.partners.update(source);
      await this.partners.update(survivor);

      await this.recordActivity(survivor.id, "PARTNER_MERGED", {
        mergedPartnerId: source.id,
      });
      await this.publishPartnerEvent(survivor, "partner.merged", {
        mergedPartnerId: source.id,
        survivorPartnerId: survivor.id,
        occurredAt: new Date().toISOString(),
      });
      // Tip birleşimi/etiket değişikliği tüketicilere güncel snapshot ile gider.
      await this.publishPartnerEvent(survivor, "partner.updated", partnerSnapshotPayload(survivor));
      return undefined;
    });
  }
}
