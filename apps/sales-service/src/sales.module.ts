import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { InventoryEventConsumer } from './infrastructure/inventory-event.consumer';
import { KafkaModule } from './infrastructure/kafka.module';
import { CreateQuoteUseCase } from './use-cases/create-quote.use-case';
import { SendQuoteUseCase } from './use-cases/send-quote.use-case';
import { AcceptQuoteUseCase } from './use-cases/accept-quote.use-case';
import { RejectQuoteUseCase } from './use-cases/reject-quote.use-case';
import { ConvertQuoteToOrderUseCase } from './use-cases/convert-quote-to-order.use-case';
import { CreateOrderUseCase } from './use-cases/create-order.use-case';
import { ConfirmOrderUseCase } from './use-cases/confirm-order.use-case';
import { ShipOrderUseCase } from './use-cases/ship-order.use-case';
import { CancelOrderUseCase } from './use-cases/cancel-order.use-case';
import { CompleteOrderUseCase } from './use-cases/complete-order.use-case';
import { CheckCreditLimitUseCase } from './use-cases/check-credit-limit.use-case';
import { HandleInventoryEventUseCase } from './use-cases/handle-inventory-event.use-case';

@Module({
  imports: [KafkaModule],
  controllers: [SalesController, InventoryEventConsumer],
  providers: [
    CreateQuoteUseCase,
    SendQuoteUseCase,
    AcceptQuoteUseCase,
    RejectQuoteUseCase,
    ConvertQuoteToOrderUseCase,
    CreateOrderUseCase,
    ConfirmOrderUseCase,
    ShipOrderUseCase,
    CancelOrderUseCase,
    CompleteOrderUseCase,
    CheckCreditLimitUseCase,
    HandleInventoryEventUseCase,
  ],
})
export class SalesModule {}
