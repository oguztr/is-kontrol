import { SignJWT, importPKCS8 } from "jose";
import type {
  AccessTokenClaims,
  IAccessTokenSignerPort,
  SignedAccessToken,
} from "../../application/ports/access-token-signer.port";
import type { AuthConfig } from "../../config/auth.config";

type SigningKey = Awaited<ReturnType<typeof importPKCS8>>;

/* Access token'ı RS256 private key ile imzalar. Diğer servisler yalnız
 * public key ile (libs/shared/auth JwtAuthGuard) doğrular; bu servise ağ
 * çağrısı yapılmaz. Claim'ler shared-auth AccessTokenPayload sözleşmesidir. */
export class JoseAccessTokenSigner implements IAccessTokenSignerPort {
  private key?: Promise<SigningKey>;

  constructor(private readonly config: AuthConfig) {}

  async sign(claims: AccessTokenClaims): Promise<SignedAccessToken> {
    this.key ??= importPKCS8(this.config.privateKeyPem, "RS256");
    const token = await new SignJWT({
      companyId: claims.companyId,
      email: claims.email,
      role: claims.role,
      permissions: claims.permissions,
    })
      .setProtectedHeader({ alg: "RS256" })
      .setSubject(claims.userId)
      .setJti(crypto.randomUUID())
      .setIssuedAt()
      .setIssuer(this.config.issuer)
      .setAudience(this.config.audience)
      .setExpirationTime(`${this.config.accessTokenTtlSeconds}s`)
      .sign(await this.key);
    return { token, expiresInSeconds: this.config.accessTokenTtlSeconds };
  }
}
