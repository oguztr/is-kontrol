import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { ReserveStockUseCase } from './use-cases/reserve-stock.use-case';
import { ReduceStockUseCase } from './use-cases/reduce-stock.use-case';
import { CreateProductUseCase } from './use-cases/create-product.use-case';

@Module({
  controllers: [InventoryController],
  providers: [ReserveStockUseCase, ReduceStockUseCase, CreateProductUseCase],
})
export class InventoryModule {}
