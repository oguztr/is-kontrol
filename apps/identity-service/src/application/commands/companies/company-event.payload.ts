import type { CompanyEntity } from "../../../domain/entities/company.entity";

/* Tüketen servislerin (inventory, customer) company_references cache'ini
 * besleyen anlık görüntü; alanlar tüketicilerin consumed-event şemalarıyla
 * birebir hizalıdır (id, name, baseCurrencyCode, isActive, occurredAt). */
export function companySnapshotPayload(
  company: CompanyEntity,
): Record<string, unknown> {
  return {
    id: company.id,
    name: company.name,
    baseCurrencyCode: company.baseCurrencyCode,
    isActive: company.isActive,
    occurredAt: new Date().toISOString(),
  };
}

export function companyStatusPayload(
  company: CompanyEntity,
): Record<string, unknown> {
  return {
    id: company.id,
    isActive: company.isActive,
    occurredAt: new Date().toISOString(),
  };
}
