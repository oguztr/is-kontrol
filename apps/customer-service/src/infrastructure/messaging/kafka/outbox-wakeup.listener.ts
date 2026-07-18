import type { Sql } from 'postgres';
import { OUTBOX_WAKEUP_CHANNEL } from '../../persistence/drizzle/repositories/outbox.repository'
import { OutboxPublisherWorker } from './outbox-publisher.worker';

/* Postgres LISTEN/NOTIFY ile outbox worker'ını anında uyandırır: outbox'a
 * yazan transaction commit olur olmaz NOTIFY iletilir ve worker interval
 * beklemeden kuyruğu boşaltır. postgres-js LISTEN için kendi özel
 * bağlantısını açar ve kopan bağlantıyı kendisi yeniler; onlisten her
 * (yeniden) bağlanmada çağrıldığından kesinti sırasında kaçan bildirimler
 * de bir drain turuyla telafi edilir. */
export class OutboxWakeupListener {
  private unlisten: (() => Promise<void>) | null = null;

  constructor(
    private readonly sql: Sql,
    private readonly worker: OutboxPublisherWorker,
  ) {}

  async start(): Promise<void> {
    const { unlisten } = await this.sql.listen(
      OUTBOX_WAKEUP_CHANNEL,
      () => this.worker.wake(),
      () => this.worker.wake(),
    );
    this.unlisten = unlisten;
  }

  async stop(): Promise<void> {
    if (!this.unlisten) return;
    await this.unlisten();
    this.unlisten = null;
  }
}
