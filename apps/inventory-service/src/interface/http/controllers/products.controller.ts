import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateProductHandler } from '../../../application/commands/products/create-product/create-product.handler';
import { CreateProductCommand } from '../../../application/commands/products/create-product/create-product.command';
import { createProductSchema } from '../dto/products/create-product.dto';
import type { CreateProductDto } from '../dto/products/create-product.dto';
import { ZodValidationPipe } from '../zod-validation.pipe';
import { unwrapDomainResult } from '../domain-error.mapper';

@Controller('products')
export class ProductsController {
  constructor(private readonly createProductHandler: CreateProductHandler) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createProductSchema)) body: CreateProductDto,
  ) {
    const command = new CreateProductCommand(
      body.companyId,
      body.sku,
      body.name,
      body.baseUnitId,
      body.description ?? null,
      body.categoryId ?? null,
      body.defaultCurrencyId ?? null,
      body.minStockLevel,
      body.maxStockLevel ?? null,
    );
    return unwrapDomainResult(await this.createProductHandler.execute(command));
  }
}
