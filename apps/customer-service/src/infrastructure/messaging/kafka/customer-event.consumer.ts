import { Controller, Inject, Logger } from '@nestjs/common';
import { ClientKafka, Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ZodError } from 'zod';
import { ConsumedEventDispatcher } from '../../../application/event-handlers/consumed-event.dispatcher'
import { parseConsumedEventPayload } from '../../../application/event-handlers/consumed-event.schemas'
import { CorrelationContext } from '../../correlation/correlation-context';
import { KAFKA_CLIENT } from './kafka.module';

// Diğer servislerin event'lerini tüketir ve idempotent dispatcher'a iletir.
// Yeni bir event türü eklemek = yeni bir @EventPattern metodu + dispatcher
// map'ine handler kaydı.
@Controller()
export class CustomerEventConsumer {
  constructor(
    private readonly dispatcher: ConsumedEventDispatcher,
    private readonly correlation: CorrelationContext,
    @Inject(KAFKA_CLIENT) private readonly kafkaClient: ClientKafka,
  ) {}

  @EventPattern('company.created')
  async onCompanyCreated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) {
    await this.dispatch('company.created', payload, context);
  }

  @EventPattern('company.updated')
  async onCompanyUpdated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('company.updated', payload, context); }
  @EventPattern('company.activated')
  async onCompanyActivated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('company.activated', payload, context); }
  @EventPattern('company.deactivated')
  async onCompanyDeactivated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('company.deactivated', payload, context); }

  // inventory-service ürün kataloğu: product_references cache'ini besler.
  @EventPattern('product.created')
  async onProductCreated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) {
    await this.dispatch('product.created', payload, context);
  }
  @EventPattern('product.updated')
  async onProductUpdated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('product.updated', payload, context); }
  @EventPattern('product.activated')
  async onProductActivated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('product.activated', payload, context); }
  @EventPattern('product.deactivated')
  async onProductDeactivated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('product.deactivated', payload, context); }
  @EventPattern('product.archived')
  async onProductArchived(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('product.archived', payload, context); }
  @EventPattern('product.deleted')
  async onProductDeleted(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('product.deleted', payload, context); }

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
    // Üretici correlation göndermediyse event zinciri buradan başlar.
    const correlationId =
      message.headers?.['correlation-id']?.toString() ?? crypto.randomUUID();

    try {
      const validatedPayload = parseConsumedEventPayload(eventType, payload);
      await this.correlation.run(correlationId, () =>
        this.dispatcher.dispatch({
          eventId,
          eventType,
          payload: validatedPayload,
        }),
      );
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
            'source-service': 'customer-service',
            'failure-reason': 'schema-validation',
          },
        }),
      );
      Logger.error(
        `Geçersiz ${eventType} eventi DLQ'ya taşındı: ${eventId}`,
        CustomerEventConsumer.name,
      );
    }
  }
}
