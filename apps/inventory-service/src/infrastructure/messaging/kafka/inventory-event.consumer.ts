import { Controller, Inject, Logger } from '@nestjs/common';
import { ClientKafka, Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ZodError } from 'zod';
import { ConsumedEventDispatcher } from '../../../application/event-handlers/consumed-event.dispatcher'
import { parseConsumedEventPayload } from '../../../application/event-handlers/consumed-event.schemas'
import { KAFKA_CLIENT } from './kafka.module';

// Diğer servislerin event'lerini tüketir ve idempotent dispatcher'a iletir.
// Yeni bir event türü eklemek = yeni bir @EventPattern metodu + dispatcher
// map'ine handler kaydı.
@Controller()
export class InventoryEventConsumer {
  constructor(
    private readonly dispatcher: ConsumedEventDispatcher,
    @Inject(KAFKA_CLIENT) private readonly kafkaClient: ClientKafka,
  ) {}

  @EventPattern('company.created')
  async onCompanyCreated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) {
    await this.dispatch('company.created', payload, context);
  }

  @EventPattern('currency.created')
  async onCurrencyCreated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) {
    await this.dispatch('currency.created', payload, context);
  }

  @EventPattern('supplier.created')
  async onSupplierCreated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) {
    await this.dispatch('supplier.created', payload, context);
  }

  @EventPattern('customer.created')
  async onCustomerCreated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) {
    await this.dispatch('customer.created', payload, context);
  }

  private async dispatch(
    eventType: string,
    payload: Record<string, unknown>,
    context: KafkaContext,
  ): Promise<void> {
    const message = context.getMessage();
    const headerEventId = message.headers?.['event-id']?.toString();
    const eventId =
      headerEventId ??
      `${context.getTopic()}-${context.getPartition()}-${message.offset}`;

    try {
      const validatedPayload = parseConsumedEventPayload(eventType, payload);
      await this.dispatcher.dispatch({
        eventId,
        eventType,
        payload: validatedPayload,
      });
    } catch (error) {
      if (!(error instanceof ZodError)) {
        throw error;
      }

      // Kalıcı contract hataları partition'ı sonsuza dek bloke etmesin.
      // DLQ publish başarısız olursa hata yukarı taşınır ve Kafka tekrar dener.
      await lastValueFrom(
        this.kafkaClient.emit(`${eventType}.dlq`, {
          key: message.key?.toString() ?? eventId,
          value: JSON.stringify({
            eventId,
            eventType,
            payload,
            source: {
              topic: context.getTopic(),
              partition: context.getPartition(),
              offset: message.offset,
            },
            issues: error.issues,
            failedAt: new Date().toISOString(),
          }),
          headers: {
            'event-id': eventId,
            'source-service': 'inventory-service',
            'failure-reason': 'schema-validation',
          },
        }),
      );
      Logger.error(
        `Geçersiz ${eventType} eventi DLQ'ya taşındı: ${eventId}`,
        InventoryEventConsumer.name,
      );
    }
  }
}
