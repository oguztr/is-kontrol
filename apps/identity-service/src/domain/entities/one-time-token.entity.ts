export type OneTimeTokenPurpose = "PASSWORD_RESET" | "EMAIL_VERIFICATION";

/* Süreli, tek kullanımlık token (şifre sıfırlama / e-posta doğrulama).
 * Token'ın kendisi saklanmaz, yalnız SHA-256 hash'i. */
export class OneTimeTokenEntity {
  public readonly id: string;
  public readonly userId: string;
  public readonly purpose: OneTimeTokenPurpose;
  public readonly tokenHash: string;
  public readonly expiresAt: Date;
  public usedAt: Date | null;
  public readonly createdAt: Date;

  constructor(params: {
    id: string;
    userId: string;
    purpose: OneTimeTokenPurpose;
    tokenHash: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
  }) {
    this.id = params.id;
    this.userId = params.userId;
    this.purpose = params.purpose;
    this.tokenHash = params.tokenHash;
    this.expiresAt = params.expiresAt;
    this.usedAt = params.usedAt;
    this.createdAt = params.createdAt;
  }

  get isUsable(): boolean {
    return this.usedAt === null && this.expiresAt.getTime() > Date.now();
  }

  markUsed(): void {
    this.usedAt = new Date();
  }
}
