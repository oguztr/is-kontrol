import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'shared-auth:required-permissions';

/** Endpoint için gerekli izin(ler); birden fazla verilirse HEPSİ gerekir.
 *  Format: "kaynak:aksiyon" — ör. @RequirePermission('inventory:write'). */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
