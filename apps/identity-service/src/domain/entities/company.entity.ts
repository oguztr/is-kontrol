export type CompanyStatus = "ACTIVE" | "SUSPENDED";

export class CompanyEntity {
  public readonly id: string;
  public name: string;
  public baseCurrencyCode: string;
  public timezone: string;
  public locale: string;
  public status: CompanyStatus;
  public suspendedAt: Date | null;
  public planTier: string;
  public maxUsers: number | null;
  public featureFlags: Record<string, unknown>;
  public readonly createdAt: Date;
  public deletedAt: Date | null;

  constructor(params: {
    id: string;
    name: string;
    baseCurrencyCode: string;
    timezone: string;
    locale: string;
    status: CompanyStatus;
    suspendedAt: Date | null;
    planTier: string;
    maxUsers: number | null;
    featureFlags: Record<string, unknown>;
    createdAt: Date;
    deletedAt: Date | null;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.baseCurrencyCode = params.baseCurrencyCode;
    this.timezone = params.timezone;
    this.locale = params.locale;
    this.status = params.status;
    this.suspendedAt = params.suspendedAt;
    this.planTier = params.planTier;
    this.maxUsers = params.maxUsers;
    this.featureFlags = params.featureFlags;
    this.createdAt = params.createdAt;
    this.deletedAt = params.deletedAt;
  }

  get isActive(): boolean {
    return this.status === "ACTIVE" && this.deletedAt === null;
  }

  suspend(): void {
    this.status = "SUSPENDED";
    this.suspendedAt = new Date();
  }

  reactivate(): void {
    this.status = "ACTIVE";
    this.suspendedAt = null;
  }

  softDelete(): void {
    this.deletedAt = new Date();
  }
}
