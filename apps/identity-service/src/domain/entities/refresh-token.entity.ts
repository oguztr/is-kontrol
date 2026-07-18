/* Refresh token rotasyon zincirinin bir halkası. Aynı familyId'yi paylaşan
 * satırlar tek oturumu (cihazı) temsil eder; revoke edilmiş bir token tekrar
 * kullanılırsa tüm family çalıntı kabul edilip düşürülür. */
export class RefreshTokenEntity {
  public readonly id: string;
  public readonly userId: string;
  public readonly tokenHash: string;
  public readonly familyId: string;
  public readonly expiresAt: Date;
  public revokedAt: Date | null;
  public replacedByTokenId: string | null;
  public readonly userAgent: string | null;
  public readonly ipAddress: string | null;
  public readonly createdAt: Date;

  constructor(params: {
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    revokedAt: Date | null;
    replacedByTokenId: string | null;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: Date;
  }) {
    this.id = params.id;
    this.userId = params.userId;
    this.tokenHash = params.tokenHash;
    this.familyId = params.familyId;
    this.expiresAt = params.expiresAt;
    this.revokedAt = params.revokedAt;
    this.replacedByTokenId = params.replacedByTokenId;
    this.userAgent = params.userAgent;
    this.ipAddress = params.ipAddress;
    this.createdAt = params.createdAt;
  }

  get isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  get isExpired(): boolean {
    return this.expiresAt.getTime() <= Date.now();
  }

  get isUsable(): boolean {
    return !this.isRevoked && !this.isExpired;
  }

  revoke(replacedByTokenId: string | null = null): void {
    this.revokedAt = new Date();
    this.replacedByTokenId = replacedByTokenId;
  }
}
