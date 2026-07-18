export type UserStatus = "ACTIVE" | "DEACTIVATED";

export class UserEntity {
  public readonly id: string;
  public readonly companyId: string;
  public roleId: string;
  public readonly email: string;
  public passwordHash: string;
  public firstName: string;
  public lastName: string;
  public phone: string | null;
  public avatarUrl: string | null;
  public status: UserStatus;
  public emailVerifiedAt: Date | null;
  public lastLoginAt: Date | null;
  public readonly createdAt: Date;
  public deletedAt: Date | null;

  constructor(params: {
    id: string;
    companyId: string;
    roleId: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatarUrl: string | null;
    status: UserStatus;
    emailVerifiedAt: Date | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    deletedAt: Date | null;
  }) {
    this.id = params.id;
    this.companyId = params.companyId;
    this.roleId = params.roleId;
    this.email = params.email;
    this.passwordHash = params.passwordHash;
    this.firstName = params.firstName;
    this.lastName = params.lastName;
    this.phone = params.phone;
    this.avatarUrl = params.avatarUrl;
    this.status = params.status;
    this.emailVerifiedAt = params.emailVerifiedAt;
    this.lastLoginAt = params.lastLoginAt;
    this.createdAt = params.createdAt;
    this.deletedAt = params.deletedAt;
  }

  get isActive(): boolean {
    return this.status === "ACTIVE" && this.deletedAt === null;
  }

  deactivate(): void {
    this.status = "DEACTIVATED";
  }

  reactivate(): void {
    this.status = "ACTIVE";
  }

  softDelete(): void {
    this.deletedAt = new Date();
  }

  recordLogin(): void {
    this.lastLoginAt = new Date();
  }
}
