import type { UserEntity } from "../../../domain/entities/user.entity";
import { RefreshTokenEntity } from "../../../domain/entities/refresh-token.entity";
import type { IRoleRepository } from "../../../domain/repositories/role.repository.interface";
import type { IUserPermissionOverrideRepository } from "../../../domain/repositories/user-permission-override.repository.interface";
import type { IRefreshTokenRepository } from "../../../domain/repositories/refresh-token.repository.interface";
import type { IAccessTokenSignerPort } from "../../ports/access-token-signer.port";
import { effectivePermissions } from "./effective-permissions";
import { newOpaqueToken } from "./token.util";

export interface IssuedSession {
  accessToken: string;
  expiresInSeconds: number;
  refreshToken: string;
  refreshTokenId: string;
  roleCode: string;
}

export interface SessionContext {
  userAgent: string | null;
  ipAddress: string | null;
  /** Rotasyonda mevcut oturumun zinciri sürdürülür; login'de yeni üretilir. */
  familyId?: string;
}

/* Login ve refresh'in ortak gövdesi: efektif izinleri hesaplar, access
 * token'ı imzalar, refresh token satırını yazar. Çağıran handler bunu bir
 * unit-of-work içinde kullanır. */
export class AuthSessionFactory {
  constructor(
    private readonly roles: IRoleRepository,
    private readonly overrides: IUserPermissionOverrideRepository,
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly accessTokenSigner: IAccessTokenSignerPort,
    private readonly refreshTokenTtlDays: number,
  ) {}

  async issue(user: UserEntity, context: SessionContext): Promise<IssuedSession> {
    const role = await this.roles.findById(user.roleId);
    // Rol FK restrict ile korunur; yokluğu veri bütünlüğü hatasıdır.
    if (!role) throw new Error(`Role ${user.roleId} not found for user ${user.id}`);

    const permissions = effectivePermissions(
      role.permissions,
      await this.overrides.listByUser(user.id),
    );
    const signed = await this.accessTokenSigner.sign({
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      role: role.code,
      permissions,
    });

    const { token, tokenHash } = newOpaqueToken();
    const refreshTokenId = crypto.randomUUID();
    await this.refreshTokens.save(
      new RefreshTokenEntity({
        id: refreshTokenId,
        userId: user.id,
        tokenHash,
        familyId: context.familyId ?? crypto.randomUUID(),
        expiresAt: new Date(
          Date.now() + this.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
        ),
        revokedAt: null,
        replacedByTokenId: null,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        createdAt: new Date(),
      }),
    );

    return {
      accessToken: signed.token,
      expiresInSeconds: signed.expiresInSeconds,
      refreshToken: token,
      refreshTokenId,
      roleCode: role.code,
    };
  }
}
