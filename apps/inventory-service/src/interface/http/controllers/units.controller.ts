import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { UnitManagementUseCase } from '../../../application/use-cases/unit-management.use-case';
import { unwrapDomainResult } from '../domain-error.mapper';
import { ZodValidationPipe } from '../zod-validation.pipe';
import { idParamSchema } from '../dto/common/id-param.dto';
import type { IdParamDto } from '../dto/common/id-param.dto';
import {
  companyQuerySchema, conversionFactorSchema, createUnitGroupSchema, createUnitSchema,
  unitListQuerySchema, updateUnitGroupSchema, updateUnitSchema,
} from '../dto/units/unit.dto';
import type {
  CompanyQueryDto, ConversionFactorDto, CreateUnitDto, CreateUnitGroupDto,
  UnitListQueryDto, UpdateUnitDto, UpdateUnitGroupDto,
} from '../dto/units/unit.dto';

@Controller()
export class UnitsController {
  constructor(private readonly useCase: UnitManagementUseCase) {}

  @Post('unit-groups') @HttpCode(HttpStatus.CREATED)
  async createGroup(@Body(new ZodValidationPipe(createUnitGroupSchema)) body: CreateUnitGroupDto) {
    return unwrapDomainResult(await this.useCase.createGroup(body));
  }

  @Patch('unit-groups/:id')
  async updateGroup(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(updateUnitGroupSchema)) body: UpdateUnitGroupDto) {
    unwrapDomainResult(await this.useCase.updateGroup(id, body.name));
  }

  @Delete('unit-groups/:id') @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGroup(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    unwrapDomainResult(await this.useCase.deleteGroup(id));
  }

  @Get('unit-groups')
  async listGroups(@Query(new ZodValidationPipe(companyQuerySchema)) query: CompanyQueryDto) {
    return unwrapDomainResult(await this.useCase.listGroups(query.companyId));
  }

  @Post('units') @HttpCode(HttpStatus.CREATED)
  async createUnit(@Body(new ZodValidationPipe(createUnitSchema)) body: CreateUnitDto) {
    return unwrapDomainResult(await this.useCase.createUnit(body));
  }

  @Patch('units/:id')
  async updateUnit(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(updateUnitSchema)) body: UpdateUnitDto) {
    unwrapDomainResult(await this.useCase.updateUnit(id, body.name));
  }

  @Patch('units/:id/deactivate') @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    unwrapDomainResult(await this.useCase.deactivateUnit(id));
  }

  @Patch('units/:id/base') @HttpCode(HttpStatus.NO_CONTENT)
  async setBase(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    unwrapDomainResult(await this.useCase.setBaseUnit(id));
  }

  @Patch('units/:id/conversion-factor') @HttpCode(HttpStatus.NO_CONTENT)
  async setFactor(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(conversionFactorSchema)) body: ConversionFactorDto) {
    unwrapDomainResult(await this.useCase.setConversionFactor(id, body.factorToBase));
  }

  @Get('units')
  async listUnits(@Query(new ZodValidationPipe(unitListQuerySchema)) query: UnitListQueryDto) {
    return unwrapDomainResult(await this.useCase.listUnits(query.companyId, query.unitGroupId));
  }

  @Get('units/:id')
  async getUnit(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return unwrapDomainResult(await this.useCase.getUnit(id));
  }
}
