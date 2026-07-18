import type { OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import type { OutboxPublisherWorker } from './outbox-publisher.worker'
import type { OutboxWakeupListener } from './outbox-wakeup.listener'

// Outbox worker'ını uygulama yaşam döngüsüne bağlar: bootstrap'te LISTEN
// aboneliğini ve fallback poll döngüsünü başlatır, kapanışta ikisini de durdurur.
export class MessagingWorkersLifecycle
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly outboxPublisherWorker: OutboxPublisherWorker,
    private readonly outboxWakeupListener: OutboxWakeupListener,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.timer = this.outboxPublisherWorker.start();
    // onlisten ilk bağlantıda da tetiklendiği için worker açılışta birikmiş
    // eventleri hemen boşaltır.
    await this.outboxWakeupListener.start();
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.outboxWakeupListener.stop();
  }
}
