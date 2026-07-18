import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import type { OutboxEvent } from '../../../domain/repositories/outbox.repository.interface'
import type { IOutboxRepository } from '../../../domain/repositories/outbox.repository.interface'
import type { IUnitOfWorkPort } from '../../../application/ports/unit-of-work.port'
import { KAFKA_CLIENT } from './kafka.module';

const BATCH_SIZE = 50;
/* Asıl tetikleyici Postgres NOTIFY'dır (OutboxWakeupListener → wake()).
 * Interval yalnızca emniyet ağıdır: kaçan bildirimler, sahibi çökmüş
 * claim'lerin devralınması ve başarısız publish'lerin yeniden denenmesi. */
const FALLBACK_POLL_INTERVAL_MS = 10_000;
const CLAIM_TIMEOUT_MS = 60_000;

// Outbox tablosundaki yayımlanmamış eventleri Kafka'ya aktarır. NOTIFY ile
// anında uyandırılır; module lifecycle ayrıca fallback interval'i başlatır.
export class OutboxPublisherWorker {
  constructor(
    private readonly outboxRepository: IOutboxRepository,
    @Inject(KAFKA_CLIENT) private readonly kafkaClient: ClientKafka,
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly workerId: string,
    private running = false,
    private wakeRequested = false,
  ) {}

  // NOTIFY geldiğinde çağrılır; hata poll içinde loglanır, fırlatılmaz.
  wake(): void {
    this.poll().catch((err) =>
      console.error('[OutboxPublisher] poll hatası:', err),
    );
  }

  /* Aynı process'te poll'lar çakışmaz: aktif tur sürerken gelen çağrılar tek
   * bir ek tura indirgenir (coalescing). Böylece tur sırasında commit olan
   * eventler bir sonraki interval'i beklemeden yayımlanır. */
  async poll(): Promise<void> {
    if (this.running) {
      this.wakeRequested = true;
      return;
    }
    this.running = true;
    try {
      do {
        this.wakeRequested = false;
        await this.drain();
      } while (this.wakeRequested);
    } finally {
      this.running = false;
    }
  }

  /* Batch dolu geldiği sürece kuyrukta devamı olabileceğinden claim etmeye
   * devam eder. Hata görülen tur drain'i durdurur: bırakılan claim'ler hemen
   * yeniden alınabilir olduğundan sürdürmek broker arızasında hot-loop yapardı;
   * kalanlar fallback interval ile yeniden denenir. */
  private async drain(): Promise<void> {
    let claimed = 0;
    let failures = 0;
    do {
      const staleBefore = new Date(Date.now() - CLAIM_TIMEOUT_MS);
      const events = await this.unitOfWork.run(() =>
        this.outboxRepository.claimUnpublished(
          BATCH_SIZE,
          this.workerId,
          staleBefore,
        ),
      );
      claimed = events.length;
      failures = 0;
      for (const event of events) {
        if (!(await this.publish(event))) failures += 1;
      }
    } while (claimed === BATCH_SIZE && failures === 0);
  }

  private async publish(event: OutboxEvent): Promise<boolean> {
    try {
      // Batch'in sonundaki eventler beklerken lease süresi dolabilir.
      // Publish öncesi yenileme ownership'i fencing kontrolüyle doğrular.
      const stillOwned = await this.outboxRepository.renewClaim(
        event.id,
        this.workerId,
      );
      if (!stillOwned) return true;
      await lastValueFrom(
        this.kafkaClient.emit(event.eventType, {
          key: event.aggregateId,
          value: JSON.stringify(event.payload),
          headers: {
            'event-id': event.id,
            'event-version': '1',
            'source-service': 'identity-service',
            ...(event.correlationId
              ? { 'correlation-id': event.correlationId }
              : {}),
          },
        }),
      );
      await this.outboxRepository.markAsPublished(event.id, this.workerId);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.outboxRepository.releaseClaim(event.id, this.workerId, message);
      console.error(`[OutboxPublisher] ${event.id} gönderilemedi:`, err);
      return false;
    }
  }

  start(): NodeJS.Timeout {
    return setInterval(() => {
      this.poll().catch((err) => console.error('[OutboxPublisher] poll hatası:', err));
    }, FALLBACK_POLL_INTERVAL_MS);
  }
}
