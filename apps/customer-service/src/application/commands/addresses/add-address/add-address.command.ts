import type { AddressType } from "../../../../domain/entities/address.entity";

export class AddAddressCommand {
  constructor(
    public readonly partnerId: string,
    public readonly type: AddressType,
    public readonly label: string | null,
    public readonly line1: string,
    public readonly line2: string | null,
    public readonly city: string,
    public readonly district: string | null,
    public readonly postalCode: string | null,
    public readonly country: string,
    public readonly isDefault: boolean,
  ) {}
}
