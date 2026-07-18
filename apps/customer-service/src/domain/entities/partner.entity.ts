export type PartnerType = "CUSTOMER" | "SUPPLIER" | "BOTH";
export type PartnerKind = "INDIVIDUAL" | "CORPORATE";
export type PartnerStatus = "ACTIVE" | "PASSIVE" | "BLACKLISTED";
export type SalesFunnelStage = "LEAD" | "PROSPECT" | "CUSTOMER";

/* Müşteri ve tedarikçi tek aggregate'te birleşir; ayrım `type` alanıyla
 * yapılır. Satış hunisi (salesFunnelStage) yalnızca CUSTOMER/BOTH tiplerinde
 * anlamlıdır — bir tedarikçi "lead" olamaz, SUPPLIER'da her zaman null'dur. */
export class PartnerEntity {
  public readonly id: string;
  public readonly companyId: string;
  public name: string;
  public type: PartnerType;
  public readonly kind: PartnerKind;
  public status: PartnerStatus;
  public salesFunnelStage: SalesFunnelStage | null;
  public assignedUserId: string | null;
  public tags: string[];
  public mergedIntoId: string | null;
  public readonly createdBy: string | null;
  public readonly createdAt: Date;
  public deletedAt: Date | null;

  constructor(params: {
    id: string;
    companyId: string;
    name: string;
    type: PartnerType;
    kind: PartnerKind;
    status: PartnerStatus;
    salesFunnelStage: SalesFunnelStage | null;
    assignedUserId: string | null;
    tags: string[];
    mergedIntoId: string | null;
    createdBy: string | null;
    createdAt: Date;
    deletedAt: Date | null;
  }) {
    this.id = params.id;
    this.companyId = params.companyId;
    this.name = params.name;
    this.type = params.type;
    this.kind = params.kind;
    this.status = params.status;
    this.salesFunnelStage = params.salesFunnelStage;
    this.assignedUserId = params.assignedUserId;
    this.tags = params.tags;
    this.mergedIntoId = params.mergedIntoId;
    this.createdBy = params.createdBy;
    this.createdAt = params.createdAt;
    this.deletedAt = params.deletedAt;
  }

  /** Satış hunisi yalnızca müşteri yüzü olan tiplerde geçerlidir. */
  get isCustomerFacing(): boolean {
    return this.type !== "SUPPLIER";
  }

  get isActive(): boolean {
    return this.status === "ACTIVE";
  }

  /* Tip yalnızca genişletilebilir (CUSTOMER→BOTH, SUPPLIER→BOTH); daraltma,
   * tüketen servislerdeki referansları geçersiz kılacağı için yasaktır. */
  canExpandTo(next: PartnerType): boolean {
    if (this.type === next) return false;
    return next === "BOTH";
  }

  expandTo(next: PartnerType): void {
    this.type = next;
  }

  addTag(tag: string): void {
    if (!this.tags.includes(tag)) this.tags = [...this.tags, tag];
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter((existing) => existing !== tag);
  }

  softDelete(): void {
    this.deletedAt = new Date();
  }

  mergeInto(survivorId: string): void {
    this.mergedIntoId = survivorId;
    this.softDelete();
  }
}
