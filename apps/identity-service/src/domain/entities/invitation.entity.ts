/* Bekleyen davet: User kaydı ancak davet kabulünde (şifreyle birlikte)
 * oluşur. Token'ın kendisi saklanmaz, yalnız SHA-256 hash'i. */
export class InvitationEntity {
  public readonly id: string;
  public readonly companyId: string;
  public readonly roleId: string;
  public readonly email: string;
  public readonly tokenHash: string;
  public readonly invitedByUserId: string;
  public readonly expiresAt: Date;
  public acceptedAt: Date | null;
  public revokedAt: Date | null;
  public readonly createdAt: Date;

  constructor(params: {
    id: string;
    companyId: string;
    roleId: string;
    email: string;
    tokenHash: string;
    invitedByUserId: string;
    expiresAt: Date;
    acceptedAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
  }) {
    this.id = params.id;
    this.companyId = params.companyId;
    this.roleId = params.roleId;
    this.email = params.email;
    this.tokenHash = params.tokenHash;
    this.invitedByUserId = params.invitedByUserId;
    this.expiresAt = params.expiresAt;
    this.acceptedAt = params.acceptedAt;
    this.revokedAt = params.revokedAt;
    this.createdAt = params.createdAt;
  }

  get isPending(): boolean {
    return this.acceptedAt === null && this.revokedAt === null;
  }

  get isExpired(): boolean {
    return this.expiresAt.getTime() <= Date.now();
  }

  accept(): void {
    this.acceptedAt = new Date();
  }

  revoke(): void {
    this.revokedAt = new Date();
  }
}
