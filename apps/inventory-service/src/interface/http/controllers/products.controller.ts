import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import type { CreateProductHandler } from '../../../application/commands/products/create-product/create-product.handler'
import { CreateProductCommand } from '../../../application/commands/products/create-product/create-product.command';

@Controller('products')
export class ProductsController {
  constructor(private readonly createProductHandler: CreateProductHandler) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: {
    companyId: string;
    sku: string;
    name: string;
    baseUnitId: string;
    description?: string;
    categoryId?: string;
    defaultCurrencyId?: string;
    minStockLevel?: string;
    maxStockLevel?: string;
  }) {
    const command = new CreateProductCommand(
      body.companyId,
      body.sku,
      body.name,
      body.baseUnitId,
      body.description ?? null,
      body.categoryId ?? null,
      body.defaultCurrencyId ?? null,
      body.minStockLevel ?? '0',
      body.maxStockLevel ?? null,
    );
    return this.createProductHandler.execute(command);
  }
}
