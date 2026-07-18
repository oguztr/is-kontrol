import type { IProcessedEventRepository } from "../../domain/repositories/processed-event.repository.interface";
import type { IUnitOfWorkPort } from "../ports/unit-of-work.port";
import type { ConsumedEvent, IConsumedEventHandler } from "./consumed-event";

/**
 * Idempotent consumer: event, handler'ın yazmalarıyla aynı transaction içinde
 * processed_events'e kaydedilir. Kayıt eklenebildiyse (ilk teslim) handler
 * çalışır; çakıştıysa event daha önce işlenmiştir ve atlanır. Handler hata
 * fırlatırsa transaction'la birlikte processed_events kaydı da geri alınır,
 * böylece Kafka'nın yeniden teslimi event'i tekrar işleyebilir.
 */
export class ConsumedEventDispatcher {
  constructor(
    private readonly unitOfWork: IUnitOfWorkPort,
    private readonly processedEventRepository: IProcessedEventRepository,
    private readonly handlers: ReadonlyMap<string, IConsumedEventHandler>,
  ) {}

  async dispatch(event: ConsumedEvent): Promise<void> {
    const handler = this.handlers.get(event.eventType);
    if (!handler) {
      console.warn(`[EventDispatcher] Handler tanımlı değil: ${event.eventType}`);
      return;
    }

    await this.unitOfWork.run(async () => {
      const firstDelivery = await this.processedEventRepository.tryMarkProcessed(
        event.eventId,
        event.eventType,
      );
      if (!firstDelivery) {
        return;
      }
      await handler.handle(event);
    });
  }
}
