import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { OrderEventConsumer } from './infrastructure/order-event.consumer';
import { KafkaModule } from './infrastructure/kafka.module';
import { ReserveStockUseCase } from './use-cases/reserve-stock.use-case';
import { ReduceStockUseCase } from './use-cases/reduce-stock.use-case';
import { ReleaseStockUseCase } from './use-cases/release-stock.use-case';
import { CreateProductUseCase } from './use-cases/create-product.use-case';
import { HandleOrderEventUseCase } from './use-cases/handle-order-event.use-case';

@Module({
  imports: [KafkaModule],
  controllers: [InventoryController, OrderEventConsumer],
  providers: [
    ReserveStockUseCase,
    ReduceStockUseCase,
    ReleaseStockUseCase,
    CreateProductUseCase,
    HandleOrderEventUseCase,
  ],
})
export class InventoryModule {}
