export type AddressType = "BILLING" | "SHIPPING" | "HEADQUARTERS" | "OTHER";

export class AddressEntity {
  public readonly id: string;
  public partnerId: string;
  public type: AddressType;
  public label: string | null;
  public line1: string;
  public line2: string | null;
  public city: string;
  public district: string | null;
  public postalCode: string | null;
  public country: string;
  /** Varsayılanlık adres tipi bazındadır (ör. varsayılan fatura adresi). */
  public isDefault: boolean;
  public readonly createdAt: Date;

  constructor(params: {
    id: string;
    partnerId: string;
    type: AddressType;
    label: string | null;
    line1: string;
    line2: string | null;
    city: string;
    district: string | null;
    postalCode: string | null;
    country: string;
    isDefault: boolean;
    createdAt: Date;
  }) {
    this.id = params.id;
    this.partnerId = params.partnerId;
    this.type = params.type;
    this.label = params.label;
    this.line1 = params.line1;
    this.line2 = params.line2;
    this.city = params.city;
    this.district = params.district;
    this.postalCode = params.postalCode;
    this.country = params.country;
    this.isDefault = params.isDefault;
    this.createdAt = params.createdAt;
  }
}
