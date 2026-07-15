import { Controller, Post, Body, HttpCode, HttpStatus, Patch, Param, Delete, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodBody, ZodQueries } from '../openapi/zod-openapi';
import { ZodValidationPipe, idParamSchema } from '@is-kontrol/shared-validation';
import type { IdParamDto } from '@is-kontrol/shared-validation';
import { CreateProductHandler } from '../../../application/commands/products/create-product/create-product.handler';
import { CreateProductCommand } from '../../../application/commands/products/create-product/create-product.command';
import { UpdateProductCommand } from '../../../application/commands/products/update-product/update-product.command';
import { UpdateProductHandler } from '../../../application/commands/products/update-product/update-product.handler';
import { ActivateProductCommand } from '../../../application/commands/products/activate-product/activate-product.command';
import { ActivateProductHandler } from '../../../application/commands/products/activate-product/activate-product.handler';
import { DeactivateProductCommand } from '../../../application/commands/products/deactivate-product/deactivate-product.command';
import { DeactivateProductHandler } from '../../../application/commands/products/deactivate-product/deactivate-product.handler';
import { ArchiveProductCommand } from '../../../application/commands/products/archive-product/archive-product.command';
import { ArchiveProductHandler } from '../../../application/commands/products/archive-product/archive-product.handler';
import { DeleteProductCommand } from '../../../application/commands/products/delete-product/delete-product.command';
import { DeleteProductHandler } from '../../../application/commands/products/delete-product/delete-product.handler';
import { ChangeProductBaseUnitCommand } from '../../../application/commands/products/change-product-base-unit/change-product-base-unit.command';
import { ChangeProductBaseUnitHandler } from '../../../application/commands/products/change-product-base-unit/change-product-base-unit.handler';
import { SetProductStockLevelsCommand } from '../../../application/commands/products/set-product-stock-levels/set-product-stock-levels.command';
import { SetProductStockLevelsHandler } from '../../../application/commands/products/set-product-stock-levels/set-product-stock-levels.handler';
import { GetProductQuery } from '../../../application/queries/products/get-product/get-product.query';
import { GetProductHandler } from '../../../application/queries/products/get-product/get-product.handler';
import { ListProductsQuery } from '../../../application/queries/products/list-products/list-products.query';
import { ListProductsHandler } from '../../../application/queries/products/list-products/list-products.handler';
import { SearchProductsQuery } from '../../../application/queries/products/search-products/search-products.query';
import { SearchProductsHandler } from '../../../application/queries/products/search-products/search-products.handler';
import { GetProductBySkuQuery } from '../../../application/queries/products/get-product-by-sku/get-product-by-sku.query';
import { GetProductBySkuHandler } from '../../../application/queries/products/get-product-by-sku/get-product-by-sku.handler';
import { GetProductByBarcodeQuery } from '../../../application/queries/products/get-product-by-barcode/get-product-by-barcode.query';
import { GetProductByBarcodeHandler } from '../../../application/queries/products/get-product-by-barcode/get-product-by-barcode.handler';
import { createProductSchema } from '../dto/products/create-product.dto';
import type { CreateProductDto } from '../dto/products/create-product.dto';
import { InventoryDomainResultInterceptor } from '../domain-result.interceptor';
import {
  changeBaseUnitSchema, productListQuerySchema, productLookupQuerySchema,
  productSearchQuerySchema, stockLevelsSchema, updateProductSchema,
} from '../dto/products/update-product.dto';
import type {
  ChangeBaseUnitDto, ProductListQueryDto, ProductLookupQueryDto,
  ProductSearchQueryDto, StockLevelsDto, UpdateProductDto,
} from '../dto/products/update-product.dto';

@ApiTags('products')
@Controller('products')
@UseInterceptors(InventoryDomainResultInterceptor)
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductHandler,
    private readonly updateProduct: UpdateProductHandler,
    private readonly activateProduct: ActivateProductHandler,
    private readonly deactivateProduct: DeactivateProductHandler,
    private readonly archiveProduct: ArchiveProductHandler,
    private readonly deleteProduct: DeleteProductHandler,
    private readonly changeProductBaseUnit: ChangeProductBaseUnitHandler,
    private readonly setProductStockLevels: SetProductStockLevelsHandler,
    private readonly getProduct: GetProductHandler,
    private readonly listProducts: ListProductsHandler,
    private readonly searchProducts: SearchProductsHandler,
    private readonly getProductBySku: GetProductBySkuHandler,
    private readonly getProductByBarcode: GetProductByBarcodeHandler,
  ) {}

  @ZodBody(createProductSchema)
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
    return this.createProduct.execute(command);
  }

  @ZodBody(updateProductSchema)
  @Patch(':id')
  async update(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(updateProductSchema)) body: UpdateProductDto) {
    return this.updateProduct.execute(new UpdateProductCommand(
      id, body.name, body.description, body.barcode,
      body.categoryId, body.defaultCurrencyId, body.minStockLevel, body.maxStockLevel));
  }
  @Patch(':id/deactivate') @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.deactivateProduct.execute(new DeactivateProductCommand(id));
  }
  @Patch(':id/activate') @HttpCode(HttpStatus.NO_CONTENT)
  async activate(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.activateProduct.execute(new ActivateProductCommand(id));
  }
  @Patch(':id/archive') @HttpCode(HttpStatus.NO_CONTENT)
  async archive(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.archiveProduct.execute(new ArchiveProductCommand(id));
  }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.deleteProduct.execute(new DeleteProductCommand(id));
  }
  @ZodBody(changeBaseUnitSchema)
  @Patch(':id/base-unit') @HttpCode(HttpStatus.NO_CONTENT)
  async changeBaseUnit(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(changeBaseUnitSchema)) body: ChangeBaseUnitDto) {
    return this.changeProductBaseUnit.execute(
      new ChangeProductBaseUnitCommand(id, body.baseUnitId));
  }
  @ZodBody(stockLevelsSchema)
  @Patch(':id/stock-levels') @HttpCode(HttpStatus.NO_CONTENT)
  async stockLevels(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(stockLevelsSchema)) body: StockLevelsDto) {
    return this.setProductStockLevels.execute(
      new SetProductStockLevelsCommand(id, body.minStockLevel, body.maxStockLevel ?? null));
  }
  @ZodQueries(productLookupQuerySchema)
  @Get('sku/:sku')
  async bySku(@Param('sku') sku: string,
    @Query(new ZodValidationPipe(productLookupQuerySchema)) query: ProductLookupQueryDto) {
    return this.getProductBySku.execute(new GetProductBySkuQuery(query.companyId, sku));
  }
  @ZodQueries(productLookupQuerySchema)
  @Get('barcode/:barcode')
  async byBarcode(@Param('barcode') barcode: string,
    @Query(new ZodValidationPipe(productLookupQuerySchema)) query: ProductLookupQueryDto) {
    return this.getProductByBarcode.execute(
      new GetProductByBarcodeQuery(query.companyId, barcode));
  }
  @ZodQueries(productSearchQuerySchema)
  @Get('search')
  async search(@Query(new ZodValidationPipe(productSearchQuerySchema)) query: ProductSearchQueryDto) {
    return this.searchProducts.execute(
      new SearchProductsQuery(query.companyId, query.q, query.isActive));
  }
  @ZodQueries(productListQuerySchema)
  @Get()
  async list(@Query(new ZodValidationPipe(productListQuerySchema)) query: ProductListQueryDto) {
    return this.listProducts.execute(new ListProductsQuery(
      query.companyId, query.categoryId, query.isActive, query.isArchived, query.name));
  }
  @Get(':id')
  async get(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.getProduct.execute(new GetProductQuery(id));
  }
}
