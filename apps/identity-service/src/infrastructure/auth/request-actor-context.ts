import { AsyncLocalStorage } from "node:async_hooks";
import type { IActorContextPort } from "../../application/ports/actor-context.port";

export interface ActorScope {
  companyId: string | null;
  userId: string | null;
}

/* x-company-id / x-user-id başlıklarından (gateway/BFF tarafından doğrulanmış
 * kabul edilir) gelen aktör kapsamını istek boyunca taşır. Başlık gelmeyen
 * çağrılarda (worker, iç test) kapsam boştur ve erişim kısıtlanmaz.
 * NOT: libs/shared/auth guard'ları servislere bağlandığında bu kapsam JWT
 * claim'lerinden dolacak; başlık tabanlı geçiş dönemi çözümüdür. */
export class RequestActorContext implements IActorContextPort {
  private readonly storage = new AsyncLocalStorage<ActorScope>();

  run<T>(scope: ActorScope, work: () => T): T {
    return this.storage.run(scope, work);
  }

  allowsCompany(companyId: string): boolean {
    const scope = this.storage.getStore();
    return !scope?.companyId || scope.companyId === companyId;
  }

  userId(): string | null {
    return this.storage.getStore()?.userId ?? null;
  }
}
