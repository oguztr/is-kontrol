import { AddressErrors } from "../../../../domain/errors/address.errors";
import type { AddressError } from "../../../../domain/errors/address.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IAddressRepository } from "../../../../domain/repositories/address.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { UpdateAddressCommand } from "./update-address.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class UpdateAddressHandler {
  constructor(
    private readonly partners: IPartnerRepository,
    private readonly addresses: IAddressRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(command: UpdateAddressCommand): Promise<Result<void, AddressError>> {
    const error = await this.unitOfWork.run<AddressError | undefined>(
      async () => {
        const address = await this.addresses.findById(command.addressId);
        if (!address) return AddressErrors.notFound(command.addressId);
        const partner = await this.partners.findById(address.partnerId);
        if (!partner || !this.actor.allowsCompany(partner.companyId)) {
          return AddressErrors.notFound(command.addressId);
        }

        // Tip değişirse varsayılanlık taşınmaz; yeni tipin varsayılanı
        // ayrıca atanır (varsayılanlık tip bazlı bir kavramdır).
        if (address.type !== command.type) address.isDefault = false;
        address.type = command.type;
        address.label = command.label;
        address.line1 = command.line1;
        address.line2 = command.line2;
        address.city = command.city;
        address.district = command.district;
        address.postalCode = command.postalCode;
        address.country = command.country;
        await this.addresses.update(address);
        return undefined;
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }
}
