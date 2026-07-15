import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodBody, ZodQueries } from '../openapi/zod-openapi';
import { ZodValidationPipe, idParamSchema } from '@is-kontrol/shared-validation';
import type { IdParamDto } from '@is-kontrol/shared-validation';
import { CreateWarehouseCommand } from '../../../application/commands/warehouses/create-warehouse/create-warehouse.command';
import { CreateWarehouseHandler } from '../../../application/commands/warehouses/create-warehouse/create-warehouse.handler';
import { UpdateWarehouseCommand } from '../../../application/commands/warehouses/update-warehouse/update-warehouse.command';
import { UpdateWarehouseHandler } from '../../../application/commands/warehouses/update-warehouse/update-warehouse.handler';
import { ActivateWarehouseCommand } from '../../../application/commands/warehouses/activate-warehouse/activate-warehouse.command';
import { ActivateWarehouseHandler } from '../../../application/commands/warehouses/activate-warehouse/activate-warehouse.handler';
import { DeactivateWarehouseCommand } from '../../../application/commands/warehouses/deactivate-warehouse/deactivate-warehouse.command';
import { DeactivateWarehouseHandler } from '../../../application/commands/warehouses/deactivate-warehouse/deactivate-warehouse.handler';
import { DeleteWarehouseCommand } from '../../../application/commands/warehouses/delete-warehouse/delete-warehouse.command';
import { DeleteWarehouseHandler } from '../../../application/commands/warehouses/delete-warehouse/delete-warehouse.handler';
import { GetWarehouseQuery } from '../../../application/queries/warehouses/get-warehouse/get-warehouse.query';
import { GetWarehouseHandler } from '../../../application/queries/warehouses/get-warehouse/get-warehouse.handler';
import { ListWarehousesQuery } from '../../../application/queries/warehouses/list-warehouses/list-warehouses.query';
import { ListWarehousesHandler } from '../../../application/queries/warehouses/list-warehouses/list-warehouses.handler';
import { InventoryDomainResultInterceptor } from '../domain-result.interceptor';
import { createWarehouseSchema, updateWarehouseSchema, warehouseListQuerySchema } from '../dto/warehouses/warehouse.dto';
import type { CreateWarehouseDto, UpdateWarehouseDto, WarehouseListQueryDto } from '../dto/warehouses/warehouse.dto';

@ApiTags('warehouses')
@Controller('warehouses')
@UseInterceptors(InventoryDomainResultInterceptor)
export class WarehousesController {
  constructor(
    private readonly createWarehouse: CreateWarehouseHandler,
    private readonly updateWarehouse: UpdateWarehouseHandler,
    private readonly activateWarehouse: ActivateWarehouseHandler,
    private readonly deactivateWarehouse: DeactivateWarehouseHandler,
    private readonly deleteWarehouse: DeleteWarehouseHandler,
    private readonly getWarehouse: GetWarehouseHandler,
    private readonly listWarehouses: ListWarehousesHandler,
  ) {}

  @ZodBody(createWarehouseSchema)
  @Post() @HttpCode(HttpStatus.CREATED)
  async create(@Body(new ZodValidationPipe(createWarehouseSchema)) body: CreateWarehouseDto) {
    return this.createWarehouse.execute(
      new CreateWarehouseCommand(body.companyId, body.code, body.name, body.address ?? null));
  }

  @ZodBody(updateWarehouseSchema)
  @Patch(':id')
  async update(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(updateWarehouseSchema)) body: UpdateWarehouseDto) {
    return this.updateWarehouse.execute(
      new UpdateWarehouseCommand(id, body.name, body.address ?? null));
  }

  @Patch(':id/deactivate') @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.deactivateWarehouse.execute(new DeactivateWarehouseCommand(id));
  }

  @Patch(':id/activate') @HttpCode(HttpStatus.NO_CONTENT)
  async activate(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.activateWarehouse.execute(new ActivateWarehouseCommand(id));
  }

  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.deleteWarehouse.execute(new DeleteWarehouseCommand(id));
  }

  @ZodQueries(warehouseListQuerySchema)
  @Get()
  async list(@Query(new ZodValidationPipe(warehouseListQuerySchema)) query: WarehouseListQueryDto) {
    return this.listWarehouses.execute(new ListWarehousesQuery(query.companyId));
  }

  @Get(':id')
  async get(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.getWarehouse.execute(new GetWarehouseQuery(id));
  }
}
