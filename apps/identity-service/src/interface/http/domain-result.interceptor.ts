import { HttpStatus } from "@nestjs/common";
import { DomainResultInterceptor } from "@is-kontrol/shared-interceptors";
import type { CompanyError } from "../../domain/errors/company.errors";
import type { UserError } from "../../domain/errors/user.errors";
import type { AuthError } from "../../domain/errors/auth.errors";

export type IdentityDomainError = CompanyError | UserError | AuthError;

// Kimlik hataları 401 (kimlik kanıtlanamadı) / 403 (kimlik var, erişim yok);
// path ile adreslenen kaynak yoksa 404, body içindeki referans çözülemezse
// 422, mevcut durumla çelişen geçişlerde 409, süresi dolmuş davette 410.
const STATUS_BY_CODE: Readonly<
  Record<IdentityDomainError["code"], HttpStatus>
> = {
  COMPANY_NOT_FOUND: HttpStatus.NOT_FOUND,
  COMPANY_ALREADY_SUSPENDED: HttpStatus.CONFLICT,
  COMPANY_NOT_SUSPENDED: HttpStatus.CONFLICT,
  USER_NOT_FOUND: HttpStatus.NOT_FOUND,
  EMAIL_ALREADY_IN_USE: HttpStatus.CONFLICT,
  ROLE_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
  INVITATION_NOT_FOUND: HttpStatus.NOT_FOUND,
  INVITATION_NOT_PENDING: HttpStatus.CONFLICT,
  INVITATION_EXPIRED: HttpStatus.GONE,
  INVITATION_ALREADY_PENDING: HttpStatus.CONFLICT,
  USER_LIMIT_REACHED: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
  USER_DEACTIVATED: HttpStatus.FORBIDDEN,
  COMPANY_SUSPENDED: HttpStatus.FORBIDDEN,
  INVALID_REFRESH_TOKEN: HttpStatus.UNAUTHORIZED,
  REFRESH_TOKEN_REUSED: HttpStatus.UNAUTHORIZED,
  INVALID_ONE_TIME_TOKEN: HttpStatus.UNPROCESSABLE_ENTITY,
  CURRENT_PASSWORD_MISMATCH: HttpStatus.UNPROCESSABLE_ENTITY,
};

/* Identity hata kodlarını HTTP durumlarına bağlayan hazır interceptor.
 * Controller sınıfına `@UseInterceptors(IdentityDomainResultInterceptor)`
 * eklenir; handler'lar use case'in döndürdüğü Result'ı olduğu gibi döner. */
export class IdentityDomainResultInterceptor extends DomainResultInterceptor {
  constructor() {
    super(STATUS_BY_CODE);
  }
}
