import { getTenantId } from '../tenant-context/tenant-context.js';

export class RlsConnection {
  withTenantScope<T>(query: (tenantId: string) => T): T {
    const tenantId = getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required for RLS queries');
    }
    return query(tenantId);
  }
}
