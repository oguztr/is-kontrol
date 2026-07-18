import type { PartnerEntity } from "../../../../domain/entities/partner.entity";
import { PartnerErrors } from "../../../../domain/errors/partner.errors";
import type { PartnerError } from "../../../../domain/errors/partner.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { ICompanyReferenceRepository } from "../../../../domain/repositories/company-reference.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ListPartnersQuery } from "./list-partners.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class ListPartnersHandler {
  constructor(
    private readonly partners: IPartnerRepository,
    private readonly companyReferences: ICompanyReferenceRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: ListPartnersQuery,
  ): Promise<Result<PartnerEntity[], PartnerError>> {
    if (!this.actor.allowsCompany(query.companyId)) {
      return new Failure(PartnerErrors.companyNotFound(query.companyId));
    }
    const company = await this.companyReferences.findById(query.companyId);
    if (!company) {
      return new Failure(PartnerErrors.companyNotFound(query.companyId));
    }
    const partners = await this.partners.list({
      companyId: query.companyId,
      type: query.type,
      status: query.status,
      salesFunnelStage: query.salesFunnelStage,
      assignedUserId: query.assignedUserId,
      tag: query.tag,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
      search: query.search,
    });
    // kind filtresi bellek içinde uygulanır (liste zaten şirketle daralmıştır).
    return new Success(
      query.kind ? partners.filter((partner) => partner.kind === query.kind) : partners,
    );
  }
}
