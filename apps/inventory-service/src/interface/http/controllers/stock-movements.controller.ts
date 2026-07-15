import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodQueries } from '../openapi/zod-openapi';
import { ZodValidationPipe, idParamSchema } from '@is-kontrol/shared-validation';
import type { IdParamDto } from '@is-kontrol/shared-validation';
import { GetStockMovementQuery } from '../../../application/queries/stock-movements/get-stock-movement/get-stock-movement.query';
import { GetStockMovementHandler } from '../../../application/queries/stock-movements/get-stock-movement/get-stock-movement.handler';
import { ListStockMovementsQuery } from '../../../application/queries/stock-movements/list-stock-movements/list-stock-movements.query';
import { ListStockMovementsHandler } from '../../../application/queries/stock-movements/list-stock-movements/list-stock-movements.handler';
import { GetDocumentMovementsQuery } from '../../../application/queries/stock-movements/get-document-movements/get-document-movements.query';
import { GetDocumentMovementsHandler } from '../../../application/queries/stock-movements/get-document-movements/get-document-movements.handler';
import { GetProductMovementHistoryQuery } from '../../../application/queries/stock-movements/get-product-movement-history/get-product-movement-history.query';
import { GetProductMovementHistoryHandler } from '../../../application/queries/stock-movements/get-product-movement-history/get-product-movement-history.handler';
import { GetWarehouseMovementHistoryQuery } from '../../../application/queries/stock-movements/get-warehouse-movement-history/get-warehouse-movement-history.query';
import { GetWarehouseMovementHistoryHandler } from '../../../application/queries/stock-movements/get-warehouse-movement-history/get-warehouse-movement-history.handler';
import { InventoryDomainResultInterceptor } from '../domain-result.interceptor';
import { movementHistoryQuerySchema, movementListQuerySchema } from '../dto/stock-movements/movement.dto';
import type { MovementHistoryQueryDto, MovementListQueryDto } from '../dto/stock-movements/movement.dto';

@ApiTags('stock-movements')
@Controller('stock-movements')
@UseInterceptors(InventoryDomainResultInterceptor)
export class StockMovementsController {
  constructor(
    private readonly getStockMovement: GetStockMovementHandler,
    private readonly listStockMovements: ListStockMovementsHandler,
    private readonly getDocumentMovements: GetDocumentMovementsHandler,
    private readonly getProductHistory: GetProductMovementHistoryHandler,
    private readonly getWarehouseHistory: GetWarehouseMovementHistoryHandler,
  ) {}

  @ZodQueries(movementListQuerySchema)
  @Get()
  async list(@Query(new ZodValidationPipe(movementListQuerySchema)) query: MovementListQueryDto) {
    return this.listStockMovements.execute(new ListStockMovementsQuery(
      query.companyId, query.productId, query.warehouseId,
      query.partnerId, query.dateFrom, query.dateTo));
  }

  @Get('document/:documentId')
  async listByDocument(
    @Param('documentId', new ZodValidationPipe(idParamSchema)) documentId: IdParamDto,
  ) {
    return this.getDocumentMovements.execute(new GetDocumentMovementsQuery(documentId));
  }

  @ZodQueries(movementHistoryQuerySchema)
  @Get('product/:productId')
  async productHistory(
    @Param('productId', new ZodValidationPipe(idParamSchema)) productId: IdParamDto,
    @Query(new ZodValidationPipe(movementHistoryQuerySchema)) query: MovementHistoryQueryDto,
  ) {
    return this.getProductHistory.execute(new GetProductMovementHistoryQuery(
      productId, query.dateFrom, query.dateTo, query.limit));
  }

  @ZodQueries(movementHistoryQuerySchema)
  @Get('warehouse/:warehouseId')
  async warehouseHistory(
    @Param('warehouseId', new ZodValidationPipe(idParamSchema)) warehouseId: IdParamDto,
    @Query(new ZodValidationPipe(movementHistoryQuerySchema)) query: MovementHistoryQueryDto,
  ) {
    return this.getWarehouseHistory.execute(new GetWarehouseMovementHistoryQuery(
      warehouseId, query.dateFrom, query.dateTo, query.limit));
  }

  @Get(':id')
  async get(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.getStockMovement.execute(new GetStockMovementQuery(id));
  }
}
