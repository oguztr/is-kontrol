import { AddressErrors } from "../../../../domain/errors/address.errors";
import type { AddressError } from "../../../../domain/errors/address.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IAddressRepository } from "../../../../domain/repositories/address.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { SetDefaultAddressCommand } from "./set-default-address.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

// Tip bazında tek varsayılan: yeni varsayılan atanınca aynı tipteki önceki
// varsayılanın isDefault'u otomatik false yapılır.
export class SetDefaultAddressHandler {
  constructor(
    private readonly partners: IPartnerRepository,
    private readonly addresses: IAddressRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(command: SetDefaultAddressCommand): Promise<Result<void, AddressError>> {
    const error = await this.unitOfWork.run<AddressError | undefined>(
      async () => {
        const address = await this.addresses.findById(command.addressId);
        if (!address) return AddressErrors.notFound(command.addressId);
        const partner = await this.partners.findById(address.partnerId);
        if (!partner || !this.actor.allowsCompany(partner.companyId)) {
          return AddressErrors.notFound(command.addressId);
        }
        if (address.isDefault) return undefined;

        await this.addresses.clearDefault(address.partnerId, address.type);
        address.isDefault = true;
        await this.addresses.update(address);
        return undefined;
      },
    );
    return error ? new Failure(error) : new Success(undefined);
  }
}
