import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContext {
  tenantId: string;
  userId?: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantId(): string | undefined {
  return tenantStorage.getStore()?.tenantId;
}

export function runWithTenant<T>(context: TenantContext, fn: () => T): T {
  return tenantStorage.run(context, fn);
}
