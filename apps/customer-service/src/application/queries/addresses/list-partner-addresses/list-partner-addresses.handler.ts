import type { AddressEntity } from "../../../../domain/entities/address.entity";
import { AddressErrors } from "../../../../domain/errors/address.errors";
import type { AddressError } from "../../../../domain/errors/address.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IAddressRepository } from "../../../../domain/repositories/address.repository.interface";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { ListPartnerAddressesQuery } from "./list-partner-addresses.query";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class ListPartnerAddressesHandler {
  constructor(
    private readonly partners: IPartnerRepository,
    private readonly addresses: IAddressRepository,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    query: ListPartnerAddressesQuery,
  ): Promise<Result<AddressEntity[], AddressError>> {
    const partner = await this.partners.findById(query.partnerId);
    if (!partner || !this.actor.allowsCompany(partner.companyId)) {
      return new Failure(AddressErrors.partnerNotFound(query.partnerId));
    }
    return new Success(await this.addresses.listByPartner(partner.id));
  }
}
