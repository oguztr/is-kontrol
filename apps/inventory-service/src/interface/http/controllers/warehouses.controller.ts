import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { WarehouseManagementUseCase } from '../../../application/use-cases/warehouse-management.use-case';
import { unwrapDomainResult } from '../domain-error.mapper';
import { ZodValidationPipe } from '../zod-validation.pipe';
import { idParamSchema } from '../dto/common/id-param.dto';
import type { IdParamDto } from '../dto/common/id-param.dto';
import { createWarehouseSchema, updateWarehouseSchema, warehouseListQuerySchema } from '../dto/warehouses/warehouse.dto';
import type { CreateWarehouseDto, UpdateWarehouseDto, WarehouseListQueryDto } from '../dto/warehouses/warehouse.dto';

@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly useCase: WarehouseManagementUseCase) {}

  @Post() @HttpCode(HttpStatus.CREATED)
  async create(@Body(new ZodValidationPipe(createWarehouseSchema)) body: CreateWarehouseDto) {
    return unwrapDomainResult(await this.useCase.create({ ...body, address: body.address ?? null }));
  }

  @Patch(':id')
  async update(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(updateWarehouseSchema)) body: UpdateWarehouseDto) {
    unwrapDomainResult(await this.useCase.update(id, body.name, body.address ?? null));
  }

  @Patch(':id/deactivate') @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    unwrapDomainResult(await this.useCase.deactivate(id));
  }

  @Patch(':id/activate') @HttpCode(HttpStatus.NO_CONTENT)
  async activate(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    unwrapDomainResult(await this.useCase.activate(id));
  }

  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    unwrapDomainResult(await this.useCase.delete(id));
  }

  @Get()
  async list(@Query(new ZodValidationPipe(warehouseListQuerySchema)) query: WarehouseListQueryDto) {
    return unwrapDomainResult(await this.useCase.list(query.companyId));
  }

  @Get(':id')
  async get(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return unwrapDomainResult(await this.useCase.get(id));
  }
}
