import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodBody, ZodQueries } from '../openapi/zod-openapi';
import { ZodValidationPipe, idParamSchema } from '@is-kontrol/shared-validation';
import type { IdParamDto } from '@is-kontrol/shared-validation';
import { CreateUnitGroupCommand } from '../../../application/commands/units/create-unit-group/create-unit-group.command';
import { CreateUnitGroupHandler } from '../../../application/commands/units/create-unit-group/create-unit-group.handler';
import { UpdateUnitGroupCommand } from '../../../application/commands/units/update-unit-group/update-unit-group.command';
import { UpdateUnitGroupHandler } from '../../../application/commands/units/update-unit-group/update-unit-group.handler';
import { DeleteUnitGroupCommand } from '../../../application/commands/units/delete-unit-group/delete-unit-group.command';
import { DeleteUnitGroupHandler } from '../../../application/commands/units/delete-unit-group/delete-unit-group.handler';
import { CreateUnitCommand } from '../../../application/commands/units/create-unit/create-unit.command';
import { CreateUnitHandler } from '../../../application/commands/units/create-unit/create-unit.handler';
import { UpdateUnitCommand } from '../../../application/commands/units/update-unit/update-unit.command';
import { UpdateUnitHandler } from '../../../application/commands/units/update-unit/update-unit.handler';
import { ActivateUnitCommand } from '../../../application/commands/units/activate-unit/activate-unit.command';
import { ActivateUnitHandler } from '../../../application/commands/units/activate-unit/activate-unit.handler';
import { DeactivateUnitCommand } from '../../../application/commands/units/deactivate-unit/deactivate-unit.command';
import { DeactivateUnitHandler } from '../../../application/commands/units/deactivate-unit/deactivate-unit.handler';
import { SetBaseUnitCommand } from '../../../application/commands/units/set-base-unit/set-base-unit.command';
import { SetBaseUnitHandler } from '../../../application/commands/units/set-base-unit/set-base-unit.handler';
import { SetConversionFactorCommand } from '../../../application/commands/units/set-conversion-factor/set-conversion-factor.command';
import { SetConversionFactorHandler } from '../../../application/commands/units/set-conversion-factor/set-conversion-factor.handler';
import { GetUnitGroupQuery } from '../../../application/queries/units/get-unit-group/get-unit-group.query';
import { GetUnitGroupHandler } from '../../../application/queries/units/get-unit-group/get-unit-group.handler';
import { ListUnitGroupsQuery } from '../../../application/queries/units/list-unit-groups/list-unit-groups.query';
import { ListUnitGroupsHandler } from '../../../application/queries/units/list-unit-groups/list-unit-groups.handler';
import { GetUnitQuery } from '../../../application/queries/units/get-unit/get-unit.query';
import { GetUnitHandler } from '../../../application/queries/units/get-unit/get-unit.handler';
import { ListUnitsQuery } from '../../../application/queries/units/list-units/list-units.query';
import { ListUnitsHandler } from '../../../application/queries/units/list-units/list-units.handler';
import { InventoryDomainResultInterceptor } from '../domain-result.interceptor';
import {
  companyQuerySchema, conversionFactorSchema, createUnitGroupSchema, createUnitSchema,
  unitListQuerySchema, updateUnitGroupSchema, updateUnitSchema,
} from '../dto/units/unit.dto';
import type {
  CompanyQueryDto, ConversionFactorDto, CreateUnitDto, CreateUnitGroupDto,
  UnitListQueryDto, UpdateUnitDto, UpdateUnitGroupDto,
} from '../dto/units/unit.dto';

@ApiTags('units')
@Controller()
@UseInterceptors(InventoryDomainResultInterceptor)
export class UnitsController {
  constructor(
    private readonly createUnitGroup: CreateUnitGroupHandler,
    private readonly updateUnitGroup: UpdateUnitGroupHandler,
    private readonly deleteUnitGroup: DeleteUnitGroupHandler,
    private readonly createUnit: CreateUnitHandler,
    private readonly updateUnit: UpdateUnitHandler,
    private readonly activateUnit: ActivateUnitHandler,
    private readonly deactivateUnit: DeactivateUnitHandler,
    private readonly setBaseUnit: SetBaseUnitHandler,
    private readonly setConversionFactor: SetConversionFactorHandler,
    private readonly getUnitGroup: GetUnitGroupHandler,
    private readonly listUnitGroups: ListUnitGroupsHandler,
    private readonly getUnitQuery: GetUnitHandler,
    private readonly listUnitsQuery: ListUnitsHandler,
  ) {}

  @ZodBody(createUnitGroupSchema)
  @Post('unit-groups') @HttpCode(HttpStatus.CREATED)
  async createGroup(@Body(new ZodValidationPipe(createUnitGroupSchema)) body: CreateUnitGroupDto) {
    return this.createUnitGroup.execute(new CreateUnitGroupCommand(body.companyId, body.name));
  }

  @ZodBody(updateUnitGroupSchema)
  @Patch('unit-groups/:id')
  async updateGroup(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(updateUnitGroupSchema)) body: UpdateUnitGroupDto) {
    return this.updateUnitGroup.execute(new UpdateUnitGroupCommand(id, body.name));
  }

  @Delete('unit-groups/:id') @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGroup(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.deleteUnitGroup.execute(new DeleteUnitGroupCommand(id));
  }

  @ZodQueries(companyQuerySchema)
  @Get('unit-groups')
  async listGroups(@Query(new ZodValidationPipe(companyQuerySchema)) query: CompanyQueryDto) {
    return this.listUnitGroups.execute(new ListUnitGroupsQuery(query.companyId));
  }

  @Get('unit-groups/:id')
  async getGroup(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.getUnitGroup.execute(new GetUnitGroupQuery(id));
  }

  @ZodBody(createUnitSchema)
  @Post('units') @HttpCode(HttpStatus.CREATED)
  async create(@Body(new ZodValidationPipe(createUnitSchema)) body: CreateUnitDto) {
    return this.createUnit.execute(new CreateUnitCommand(
      body.companyId, body.unitGroupId, body.code, body.name, body.isBaseUnit, body.factorToBase));
  }

  @ZodBody(updateUnitSchema)
  @Patch('units/:id')
  async update(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(updateUnitSchema)) body: UpdateUnitDto) {
    return this.updateUnit.execute(new UpdateUnitCommand(id, body.name));
  }

  @Patch('units/:id/deactivate') @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.deactivateUnit.execute(new DeactivateUnitCommand(id));
  }

  @Patch('units/:id/activate') @HttpCode(HttpStatus.NO_CONTENT)
  async activate(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.activateUnit.execute(new ActivateUnitCommand(id));
  }

  @Patch('units/:id/base') @HttpCode(HttpStatus.NO_CONTENT)
  async setBase(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.setBaseUnit.execute(new SetBaseUnitCommand(id));
  }

  @ZodBody(conversionFactorSchema)
  @Patch('units/:id/conversion-factor') @HttpCode(HttpStatus.NO_CONTENT)
  async setFactor(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(conversionFactorSchema)) body: ConversionFactorDto) {
    return this.setConversionFactor.execute(new SetConversionFactorCommand(id, body.factorToBase));
  }

  @ZodQueries(unitListQuerySchema)
  @Get('units')
  async listUnits(@Query(new ZodValidationPipe(unitListQuerySchema)) query: UnitListQueryDto) {
    return this.listUnitsQuery.execute(new ListUnitsQuery(query.companyId, query.unitGroupId));
  }

  @Get('units/:id')
  async getUnit(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.getUnitQuery.execute(new GetUnitQuery(id));
  }
}
