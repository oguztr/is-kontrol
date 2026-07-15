import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodQueries } from '../openapi/zod-openapi';
import { ZodValidationPipe, idParamSchema } from '@is-kontrol/shared-validation';
import type { IdParamDto } from '@is-kontrol/shared-validation';
import { GetStockBalanceQuery } from '../../../application/queries/stock-balances/get-stock-balance/get-stock-balance.query';
import { GetStockBalanceHandler } from '../../../application/queries/stock-balances/get-stock-balance/get-stock-balance.handler';
import { GetProductStockQuery } from '../../../application/queries/stock-balances/get-product-stock/get-product-stock.query';
import { GetProductStockHandler } from '../../../application/queries/stock-balances/get-product-stock/get-product-stock.handler';
import { GetWarehouseStockQuery } from '../../../application/queries/stock-balances/get-warehouse-stock/get-warehouse-stock.query';
import { GetWarehouseStockHandler } from '../../../application/queries/stock-balances/get-warehouse-stock/get-warehouse-stock.handler';
import { GetInventorySummaryQuery } from '../../../application/queries/stock-balances/get-inventory-summary/get-inventory-summary.query';
import { GetInventorySummaryHandler } from '../../../application/queries/stock-balances/get-inventory-summary/get-inventory-summary.handler';
import { GetLowStockProductsQuery } from '../../../application/queries/stock-balances/get-low-stock-products/get-low-stock-products.query';
import { GetLowStockProductsHandler } from '../../../application/queries/stock-balances/get-low-stock-products/get-low-stock-products.handler';
import { GetOverstockProductsQuery } from '../../../application/queries/stock-balances/get-overstock-products/get-overstock-products.query';
import { GetOverstockProductsHandler } from '../../../application/queries/stock-balances/get-overstock-products/get-overstock-products.handler';
import { GetOutOfStockProductsQuery } from '../../../application/queries/stock-balances/get-out-of-stock-products/get-out-of-stock-products.query';
import { GetOutOfStockProductsHandler } from '../../../application/queries/stock-balances/get-out-of-stock-products/get-out-of-stock-products.handler';
import { GetNegativeStockProductsQuery } from '../../../application/queries/stock-balances/get-negative-stock-products/get-negative-stock-products.query';
import { GetNegativeStockProductsHandler } from '../../../application/queries/stock-balances/get-negative-stock-products/get-negative-stock-products.handler';
import { InventoryDomainResultInterceptor } from '../domain-result.interceptor';
import { balanceCompanyQuerySchema } from '../dto/stock-balances/balance.dto';
import type { BalanceCompanyQueryDto } from '../dto/stock-balances/balance.dto';

@ApiTags('stock-balances')
@Controller('stock-balances')
@UseInterceptors(InventoryDomainResultInterceptor)
export class StockBalancesController {
  constructor(
    private readonly getStockBalance: GetStockBalanceHandler,
    private readonly getProductStock: GetProductStockHandler,
    private readonly getWarehouseStock: GetWarehouseStockHandler,
    private readonly getInventorySummary: GetInventorySummaryHandler,
    private readonly getLowStockProducts: GetLowStockProductsHandler,
    private readonly getOverstockProducts: GetOverstockProductsHandler,
    private readonly getOutOfStockProducts: GetOutOfStockProductsHandler,
    private readonly getNegativeStockProducts: GetNegativeStockProductsHandler,
  ) {}

  @ZodQueries(balanceCompanyQuerySchema)
  @Get('summary')
  async summary(@Query(new ZodValidationPipe(balanceCompanyQuerySchema)) query: BalanceCompanyQueryDto) {
    return this.getInventorySummary.execute(new GetInventorySummaryQuery(query.companyId));
  }

  @Get('product/:productId')
  async productSummary(
    @Param('productId', new ZodValidationPipe(idParamSchema)) productId: IdParamDto,
  ) {
    return this.getProductStock.execute(new GetProductStockQuery(productId));
  }

  @Get('warehouse/:warehouseId')
  async warehouseSummary(
    @Param('warehouseId', new ZodValidationPipe(idParamSchema)) warehouseId: IdParamDto,
  ) {
    return this.getWarehouseStock.execute(new GetWarehouseStockQuery(warehouseId));
  }

  @ZodQueries(balanceCompanyQuerySchema)
  @Get('alerts/below-minimum')
  async belowMinimum(@Query(new ZodValidationPipe(balanceCompanyQuerySchema)) query: BalanceCompanyQueryDto) {
    return this.getLowStockProducts.execute(new GetLowStockProductsQuery(query.companyId));
  }

  @ZodQueries(balanceCompanyQuerySchema)
  @Get('alerts/above-maximum')
  async aboveMaximum(@Query(new ZodValidationPipe(balanceCompanyQuerySchema)) query: BalanceCompanyQueryDto) {
    return this.getOverstockProducts.execute(new GetOverstockProductsQuery(query.companyId));
  }

  @ZodQueries(balanceCompanyQuerySchema)
  @Get('alerts/out-of-stock')
  async outOfStock(@Query(new ZodValidationPipe(balanceCompanyQuerySchema)) query: BalanceCompanyQueryDto) {
    return this.getOutOfStockProducts.execute(new GetOutOfStockProductsQuery(query.companyId));
  }

  @ZodQueries(balanceCompanyQuerySchema)
  @Get('alerts/negative')
  async negative(@Query(new ZodValidationPipe(balanceCompanyQuerySchema)) query: BalanceCompanyQueryDto) {
    return this.getNegativeStockProducts.execute(new GetNegativeStockProductsQuery(query.companyId));
  }

  @Get(':warehouseId/:productId')
  async detail(
    @Param('warehouseId', new ZodValidationPipe(idParamSchema)) warehouseId: IdParamDto,
    @Param('productId', new ZodValidationPipe(idParamSchema)) productId: IdParamDto,
  ) {
    return this.getStockBalance.execute(new GetStockBalanceQuery(warehouseId, productId));
  }
}
