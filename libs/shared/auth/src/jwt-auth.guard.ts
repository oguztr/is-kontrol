import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { importSPKI, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';
import { SHARED_AUTH_OPTIONS } from './shared-auth.options.js';
import type { SharedAuthOptions } from './shared-auth.options.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from './jwt-payload.js';

/* Stateless JWT doğrulaması: token, Identity servisinin private key'i ile
 * imzalanır; bu guard SADECE public key ile imzayı doğrular — Identity'ye
 * hiçbir ağ çağrısı yapılmaz. Identity düşse bile mevcut token'larla diğer
 * servisler çalışmaya devam eder (Identity single point of failure olmaz).
 * Bedeli: revoke/suspend, access token ömrü (~15 dk) kadar gecikmeli etki
 * eder; anlık kesinti gereken durumlar CompanySuspended event'iyle çözülür. */
type SigningPublicKey = Awaited<ReturnType<typeof importSPKI>>;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private publicKey?: Promise<SigningPublicKey>;

  constructor(
    @Inject(SHARED_AUTH_OPTIONS) private readonly options: SharedAuthOptions,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers['authorization'];
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token gerekli');
    }

    try {
      const { payload } = await jwtVerify(
        header.slice('Bearer '.length),
        await this.getPublicKey(),
        {
          algorithms: [this.options.algorithm ?? 'RS256'],
          issuer: this.options.issuer,
          audience: this.options.audience,
        },
      );
      request.user = this.toAuthenticatedUser(payload);
    } catch {
      // Sebep (imza, süre, claim eksik) istemciye sızdırılmaz.
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş token');
    }
    return true;
  }

  private getPublicKey(): Promise<SigningPublicKey> {
    this.publicKey ??= importSPKI(
      this.options.publicKeyPem,
      this.options.algorithm ?? 'RS256',
    );
    return this.publicKey;
  }

  private toAuthenticatedUser(payload: JWTPayload): AuthenticatedUser {
    const { sub, companyId, email, role, permissions } = payload;
    if (
      typeof sub !== 'string' ||
      typeof companyId !== 'string' ||
      typeof email !== 'string' ||
      typeof role !== 'string' ||
      !Array.isArray(permissions) ||
      permissions.some((p) => typeof p !== 'string')
    ) {
      throw new UnauthorizedException();
    }
    return {
      userId: sub,
      companyId,
      email,
      role,
      permissions: permissions as string[],
    };
  }
}
