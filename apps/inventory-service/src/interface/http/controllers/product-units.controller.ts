import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodBody } from '../openapi/zod-openapi';
import { ZodValidationPipe, idParamSchema } from '@is-kontrol/shared-validation';
import type { IdParamDto } from '@is-kontrol/shared-validation';
import { AddProductUnitCommand } from '../../../application/commands/product-units/add-product-unit/add-product-unit.command';
import { AddProductUnitHandler } from '../../../application/commands/product-units/add-product-unit/add-product-unit.handler';
import { UpdateProductUnitCommand } from '../../../application/commands/product-units/update-product-unit/update-product-unit.command';
import { UpdateProductUnitHandler } from '../../../application/commands/product-units/update-product-unit/update-product-unit.handler';
import { RemoveProductUnitCommand } from '../../../application/commands/product-units/remove-product-unit/remove-product-unit.command';
import { RemoveProductUnitHandler } from '../../../application/commands/product-units/remove-product-unit/remove-product-unit.handler';
import { ListProductUnitsQuery } from '../../../application/queries/product-units/list-product-units/list-product-units.query';
import { ListProductUnitsHandler } from '../../../application/queries/product-units/list-product-units/list-product-units.handler';
import { InventoryDomainResultInterceptor } from '../domain-result.interceptor';
import { addProductUnitSchema, updateProductUnitSchema } from '../dto/product-units/product-unit.dto';
import type { AddProductUnitDto, UpdateProductUnitDto } from '../dto/product-units/product-unit.dto';

@ApiTags('product-units')
@Controller()
@UseInterceptors(InventoryDomainResultInterceptor)
export class ProductUnitsController {
  constructor(
    private readonly addProductUnit: AddProductUnitHandler,
    private readonly updateProductUnit: UpdateProductUnitHandler,
    private readonly removeProductUnit: RemoveProductUnitHandler,
    private readonly listProductUnits: ListProductUnitsHandler,
  ) {}

  @ZodBody(addProductUnitSchema)
  @Post('products/:id/units') @HttpCode(HttpStatus.CREATED)
  async add(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(addProductUnitSchema)) body: AddProductUnitDto) {
    return this.addProductUnit.execute(new AddProductUnitCommand(
      id, body.unitId, body.conversionFactor, body.isPurchaseUnit, body.isSalesUnit, body.barcode));
  }

  @Get('products/:id/units')
  async list(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.listProductUnits.execute(new ListProductUnitsQuery(id));
  }

  @ZodBody(updateProductUnitSchema)
  @Patch('product-units/:id')
  async update(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(updateProductUnitSchema)) body: UpdateProductUnitDto) {
    return this.updateProductUnit.execute(new UpdateProductUnitCommand(
      id, body.conversionFactor, body.isPurchaseUnit, body.isSalesUnit, body.barcode));
  }

  @Delete('product-units/:id') @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.removeProductUnit.execute(new RemoveProductUnitCommand(id));
  }
}
