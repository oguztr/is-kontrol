import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodQueries } from '../openapi/zod-openapi';
import { ZodValidationPipe, idParamSchema } from '@is-kontrol/shared-validation';
import type { IdParamDto } from '@is-kontrol/shared-validation';
import { GetInventoryValuationQuery } from '../../../application/queries/reports/get-inventory-valuation/get-inventory-valuation.query';
import { GetInventoryValuationHandler } from '../../../application/queries/reports/get-inventory-valuation/get-inventory-valuation.handler';
import { GetStockCardQuery } from '../../../application/queries/reports/get-stock-card/get-stock-card.query';
import { GetStockCardHandler } from '../../../application/queries/reports/get-stock-card/get-stock-card.handler';
import { GetInventoryDashboardQuery } from '../../../application/queries/reports/get-inventory-dashboard/get-inventory-dashboard.query';
import { GetInventoryDashboardHandler } from '../../../application/queries/reports/get-inventory-dashboard/get-inventory-dashboard.handler';
import { InventoryDomainResultInterceptor } from '../domain-result.interceptor';
import {
  dashboardQuerySchema, stockCardQuerySchema, valuationQuerySchema,
} from '../dto/reports/report.dto';
import type {
  DashboardQueryDto, StockCardQueryDto, ValuationQueryDto,
} from '../dto/reports/report.dto';

@ApiTags('reports')
@Controller('reports')
@UseInterceptors(InventoryDomainResultInterceptor)
export class ReportsController {
  constructor(
    private readonly getInventoryValuation: GetInventoryValuationHandler,
    private readonly getStockCard: GetStockCardHandler,
    private readonly getInventoryDashboard: GetInventoryDashboardHandler,
  ) {}

  @ZodQueries(valuationQuerySchema)
  @Get('valuation')
  async valuation(@Query(new ZodValidationPipe(valuationQuerySchema)) query: ValuationQueryDto) {
    return this.getInventoryValuation.execute(
      new GetInventoryValuationQuery(query.companyId, query.warehouseId));
  }

  @ZodQueries(stockCardQuerySchema)
  @Get('stock-card/:productId')
  async stockCard(
    @Param('productId', new ZodValidationPipe(idParamSchema)) productId: IdParamDto,
    @Query(new ZodValidationPipe(stockCardQuerySchema)) query: StockCardQueryDto,
  ) {
    return this.getStockCard.execute(new GetStockCardQuery(
      productId, query.warehouseId, query.dateFrom, query.dateTo));
  }

  @ZodQueries(dashboardQuerySchema)
  @Get('dashboard')
  async dashboard(@Query(new ZodValidationPipe(dashboardQuerySchema)) query: DashboardQueryDto) {
    return this.getInventoryDashboard.execute(
      new GetInventoryDashboardQuery(query.companyId));
  }
}
