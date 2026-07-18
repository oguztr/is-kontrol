import type { AddressEntity, AddressType } from "../entities/address.entity";

export interface IAddressRepository {
  findById(id: string): Promise<AddressEntity | null>;
  listByPartner(partnerId: string): Promise<AddressEntity[]>;
  save(address: AddressEntity): Promise<void>;
  update(address: AddressEntity): Promise<void>;
  delete(id: string): Promise<void>;
  /** Aynı tipteki mevcut varsayılan adresi (varsa) varsayılanlıktan düşürür. */
  clearDefault(partnerId: string, type: AddressType): Promise<void>;
  clearAllDefaults(partnerId: string): Promise<void>;
  reassignPartner(fromPartnerId: string, toPartnerId: string): Promise<void>;
}
