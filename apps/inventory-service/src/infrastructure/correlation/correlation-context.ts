import { AsyncLocalStorage } from "node:async_hooks";

/* Correlation ID'yi istek/mesaj yaşam döngüsü boyunca taşır. HTTP middleware
 * (main.ts) gelen x-correlation-id başlığını, Kafka consumer'ı ise mesajın
 * correlation-id başlığını bu bağlama koyar; outbox'a yazılan her event aynı
 * ID ile yayınlanır. Böylece bir isteğin tetiklediği event zinciri servisler
 * arasında uçtan uca izlenebilir. */
export class CorrelationContext {
  private readonly storage = new AsyncLocalStorage<string>();

  run<T>(correlationId: string, work: () => T): T {
    return this.storage.run(correlationId, work);
  }

  current(): string | undefined {
    return this.storage.getStore();
  }
}
