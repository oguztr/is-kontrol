import { Controller, Get, Post, Body } from '@nestjs/common';
import type { CreateProductDto, StockMovementDto } from '@is-kontrol/inventory-contracts';
import { ReserveStockUseCase } from './use-cases/reserve-stock.use-case';
import { CreateProductUseCase } from './use-cases/create-product.use-case';

@Controller()
export class InventoryController {
  constructor(
    private readonly reserveStock: ReserveStockUseCase,
    private readonly createProduct: CreateProductUseCase
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'inventory-service' };
  }

  @Post('products')
  postProduct(@Body() payload: CreateProductDto) {
    return this.createProduct.execute(payload);
  }

  @Post('stock/reserve')
  postReserveStock(@Body() payload: StockMovementDto) {
    return this.reserveStock.execute(payload);
  }
}
