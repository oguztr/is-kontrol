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
export class InventoryEventConsumer {
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

  @EventPattern('currency.created')
  async onCurrencyCreated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) {
    await this.dispatch('currency.created', payload, context);
  }

  @EventPattern('currency.updated')
  async onCurrencyUpdated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('currency.updated', payload, context); }
  @EventPattern('currency.activated')
  async onCurrencyActivated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('currency.activated', payload, context); }
  @EventPattern('currency.deactivated')
  async onCurrencyDeactivated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('currency.deactivated', payload, context); }
  @EventPattern('exchange-rate.updated')
  async onExchangeRateUpdated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('exchange-rate.updated', payload, context); }

  @EventPattern('supplier.created')
  async onSupplierCreated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) {
    await this.dispatch('supplier.created', payload, context);
  }
  @EventPattern('supplier.updated')
  async onSupplierUpdated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('supplier.updated', payload, context); }
  @EventPattern('supplier.activated')
  async onSupplierActivated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('supplier.activated', payload, context); }
  @EventPattern('supplier.deactivated')
  async onSupplierDeactivated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('supplier.deactivated', payload, context); }

  @EventPattern('customer.created')
  async onCustomerCreated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) {
    await this.dispatch('customer.created', payload, context);
  }
  @EventPattern('customer.updated')
  async onCustomerUpdated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('customer.updated', payload, context); }
  @EventPattern('customer.activated')
  async onCustomerActivated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('customer.activated', payload, context); }
  @EventPattern('customer.deactivated')
  async onCustomerDeactivated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('customer.deactivated', payload, context); }
  @EventPattern('business-partner.created')
  async onPartnerCreated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('business-partner.created', payload, context); }
  @EventPattern('business-partner.updated')
  async onPartnerUpdated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('business-partner.updated', payload, context); }
  @EventPattern('business-partner.activated')
  async onPartnerActivated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('business-partner.activated', payload, context); }
  @EventPattern('business-partner.deactivated')
  async onPartnerDeactivated(@Payload() payload: Record<string, unknown>, @Ctx() context: KafkaContext) { await this.dispatch('business-partner.deactivated', payload, context); }

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
