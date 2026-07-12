import { Controller, Post, Body, HttpCode, HttpStatus, Patch, Param, Delete, Get, Query } from '@nestjs/common';
import { CreateProductHandler } from '../../../application/commands/products/create-product/create-product.handler';
import { CreateProductCommand } from '../../../application/commands/products/create-product/create-product.command';
import { createProductSchema } from '../dto/products/create-product.dto';
import type { CreateProductDto } from '../dto/products/create-product.dto';
import { ZodValidationPipe } from '../zod-validation.pipe';
import { unwrapDomainResult } from '../domain-error.mapper';
import { ProductManagementUseCase } from '../../../application/use-cases/product-management.use-case';
import { idParamSchema } from '../dto/common/id-param.dto';
import type { IdParamDto } from '../dto/common/id-param.dto';
import {
  changeBaseUnitSchema, productListQuerySchema, productLookupQuerySchema,
  stockLevelsSchema, updateProductSchema,
} from '../dto/products/update-product.dto';
import type {
  ChangeBaseUnitDto, ProductListQueryDto, ProductLookupQueryDto,
  StockLevelsDto, UpdateProductDto,
} from '../dto/products/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly createProductHandler: CreateProductHandler,
    private readonly management: ProductManagementUseCase,
  ) {}

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
      body.barcode ?? null,
      body.description ?? null,
      body.categoryId ?? null,
      body.defaultCurrencyId ?? null,
      body.minStockLevel,
      body.maxStockLevel ?? null,
    );
    return unwrapDomainResult(await this.createProductHandler.execute(command));
  }

  @Patch(':id')
  async update(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(updateProductSchema)) body: UpdateProductDto) {
    unwrapDomainResult(await this.management.update(id, body));
  }
  @Patch(':id/deactivate') @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    unwrapDomainResult(await this.management.deactivate(id));
  }
  @Patch(':id/activate') @HttpCode(HttpStatus.NO_CONTENT)
  async activate(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    unwrapDomainResult(await this.management.activate(id));
  }
  @Patch(':id/archive') @HttpCode(HttpStatus.NO_CONTENT)
  async archive(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    unwrapDomainResult(await this.management.archive(id));
  }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    unwrapDomainResult(await this.management.delete(id));
  }
  @Patch(':id/base-unit') @HttpCode(HttpStatus.NO_CONTENT)
  async changeBaseUnit(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(changeBaseUnitSchema)) body: ChangeBaseUnitDto) {
    unwrapDomainResult(await this.management.changeBaseUnit(id, body.baseUnitId));
  }
  @Patch(':id/stock-levels') @HttpCode(HttpStatus.NO_CONTENT)
  async stockLevels(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(stockLevelsSchema)) body: StockLevelsDto) {
    unwrapDomainResult(await this.management.setStockLevels(id, body.minStockLevel, body.maxStockLevel ?? null));
  }
  @Get('sku/:sku')
  async bySku(@Param('sku') sku: string,
    @Query(new ZodValidationPipe(productLookupQuerySchema)) query: ProductLookupQueryDto) {
    return unwrapDomainResult(await this.management.bySku(query.companyId, sku));
  }
  @Get('barcode/:barcode')
  async byBarcode(@Param('barcode') barcode: string,
    @Query(new ZodValidationPipe(productLookupQuerySchema)) query: ProductLookupQueryDto) {
    return unwrapDomainResult(await this.management.byBarcode(query.companyId, barcode));
  }
  @Get()
  async list(@Query(new ZodValidationPipe(productListQuerySchema)) query: ProductListQueryDto) {
    return unwrapDomainResult(await this.management.list(query));
  }
  @Get(':id')
  async get(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return unwrapDomainResult(await this.management.get(id));
  }
}
