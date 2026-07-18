import type { UserPermissionOverride } from "../../../domain/repositories/user-permission-override.repository.interface";

/* Efektif izin seti: rol izinleri + kişiye özel istisnalar.
 * Öncelik: DENY > ALLOW > rol. Sonuç JWT'ye claim olarak gömülür. */
export function effectivePermissions(
  rolePermissions: readonly string[],
  overrides: readonly UserPermissionOverride[],
): string[] {
  const granted = new Set(rolePermissions);
  for (const override of overrides) {
    if (override.effect === "ALLOW") granted.add(override.permission);
  }
  for (const override of overrides) {
    if (override.effect === "DENY") granted.delete(override.permission);
  }
  return [...granted];
}
