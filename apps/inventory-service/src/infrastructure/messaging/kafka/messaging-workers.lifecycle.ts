import type { OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import type { OutboxPublisherWorker } from './outbox-publisher.worker'

// Outbox worker'ını uygulama yaşam döngüsüne bağlar:
// bootstrap'te poll döngüsünü başlatır, kapanışta timer'ı temizler.
export class MessagingWorkersLifecycle
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly outboxPublisherWorker: OutboxPublisherWorker) {}

  onApplicationBootstrap(): void {
    this.timer = this.outboxPublisherWorker.start();
  }

  onApplicationShutdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
