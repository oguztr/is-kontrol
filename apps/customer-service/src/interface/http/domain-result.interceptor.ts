import { HttpStatus } from "@nestjs/common";
import { DomainResultInterceptor } from "@is-kontrol/shared-interceptors";
import type { PartnerError } from "../../domain/errors/partner.errors";
import type { ContactError } from "../../domain/errors/contact.errors";
import type { AddressError } from "../../domain/errors/address.errors";
import type { NoteError } from "../../domain/errors/note.errors";

export type CustomerDomainError =
  | PartnerError
  | ContactError
  | AddressError
  | NoteError;

// Body içindeki referanslar çözülemediğinde 422, mevcut durumla çelişen
// geçişlerde 409, path ile adreslenen kaynak yoksa 404, yetki ihlalinde 403.
const STATUS_BY_CODE: Readonly<
  Record<CustomerDomainError["code"], HttpStatus>
> = {
  COMPANY_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
  COMPANY_INACTIVE: HttpStatus.UNPROCESSABLE_ENTITY,
  PARENT_PARTNER_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
  MERGE_SOURCE_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,
  MERGE_SAME_PARTNER: HttpStatus.UNPROCESSABLE_ENTITY,
  PARTNER_NOT_FOUND: HttpStatus.NOT_FOUND,
  CONTACT_NOT_FOUND: HttpStatus.NOT_FOUND,
  ADDRESS_NOT_FOUND: HttpStatus.NOT_FOUND,
  NOTE_NOT_FOUND: HttpStatus.NOT_FOUND,
  PARTNER_TYPE_NARROWING_NOT_ALLOWED: HttpStatus.CONFLICT,
  SALES_FUNNEL_NOT_APPLICABLE: HttpStatus.CONFLICT,
  PARTNER_NOT_CORPORATE: HttpStatus.CONFLICT,
  PARENT_PARTNER_CYCLE: HttpStatus.CONFLICT,
  MERGE_COMPANY_MISMATCH: HttpStatus.CONFLICT,
  NOTE_EDIT_FORBIDDEN: HttpStatus.FORBIDDEN,
};

export function domainErrorToHttpStatus(
  error: CustomerDomainError,
): HttpStatus {
  return STATUS_BY_CODE[error.code];
}

/* CRM hata kodlarını HTTP durumlarına bağlayan hazır interceptor.
 * Controller sınıfına `@UseInterceptors(CustomerDomainResultInterceptor)`
 * eklenir; handler'lar use case'in döndürdüğü Result'ı olduğu gibi döner. */
export class CustomerDomainResultInterceptor extends DomainResultInterceptor {
  constructor() {
    super(STATUS_BY_CODE);
  }
}
