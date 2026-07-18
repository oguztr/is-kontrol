import { AddressEntity } from "../../../../domain/entities/address.entity";
import { AddressErrors } from "../../../../domain/errors/address.errors";
import type { AddressError } from "../../../../domain/errors/address.errors";
import type { IPartnerRepository } from "../../../../domain/repositories/partner.repository.interface";
import type { IAddressRepository } from "../../../../domain/repositories/address.repository.interface";
import type { IUnitOfWorkPort } from "../../../ports/unit-of-work.port";
import type { IActorContextPort } from "../../../ports/actor-context.port";
import { AddAddressCommand } from "./add-address.command";
import { Failure, Result, Success } from "@is-kontrol/shared-result";

export class AddAddressHandler {
  constructor(
    private readonly partners: IPartnerRepository,
    private readonly addresses: IAddressRepository,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly actor: IActorContextPort,
  ) {}

  async execute(
    command: AddAddressCommand,
  ): Promise<Result<{ id: string }, AddressError>> {
    const outcome = await this.unitOfWork.run<{ id: string } | AddressError>(
      async () => {
        const partner = await this.partners.findById(command.partnerId);
        if (!partner || !this.actor.allowsCompany(partner.companyId)) {
          return AddressErrors.partnerNotFound(command.partnerId);
        }

        // Varsayılanlık tip bazındadır; yeni varsayılan öncekini düşürür.
        if (command.isDefault) {
          await this.addresses.clearDefault(partner.id, command.type);
        }
        const address = new AddressEntity({
          id: crypto.randomUUID(),
          partnerId: partner.id,
          type: command.type,
          label: command.label,
          line1: command.line1,
          line2: command.line2,
          city: command.city,
          district: command.district,
          postalCode: command.postalCode,
          country: command.country,
          isDefault: command.isDefault,
          createdAt: new Date(),
        });
        await this.addresses.save(address);
        return { id: address.id };
      },
    );
    return "code" in outcome ? new Failure(outcome) : new Success(outcome);
  }
}
