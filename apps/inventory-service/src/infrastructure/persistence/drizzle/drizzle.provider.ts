import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle } from "drizzle-orm/postgres-js";
import { databaseConfig } from "../../../config/database.config";

export const writeDb = drizzle(databaseConfig.primaryUrl);
// Replica, streaming replication ile primary'nin kopyasıdır; migration
// yalnızca primary'ye uygulanır. Replica tanımlı değilse primary kullanılır.
export const readDb = drizzle(databaseConfig.replicaUrl);

export type WriteDb = typeof writeDb;
export type ReadDb = typeof readDb;
export type WriteTx = Parameters<Parameters<WriteDb["transaction"]>[0]>[0];
export type DbExecutor = WriteDb | WriteTx;

// Aktif transaction'ı AsyncLocalStorage ile taşır. Repository'ler sorgularını
// `session.db` üzerinden çalıştırır: bir unit-of-work içindeysek transaction
// handle'ı, değilsek kök bağlantı döner. Böylece aynı repository kodu hem
// transaction içinde hem dışında değişiklik gerektirmeden çalışır.
export class DrizzleTransactionHost {
  private readonly storage = new AsyncLocalStorage<WriteTx>();

  constructor(private readonly rootDb: WriteDb) {}

  get db(): DbExecutor {
    return this.storage.getStore() ?? this.rootDb;
  }

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.rootDb.transaction(async (tx) => this.storage.run(tx, work));
  }
}
