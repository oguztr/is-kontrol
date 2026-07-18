import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodBody } from '../openapi/zod-openapi';
import { ZodValidationPipe, idParamSchema } from '@is-kontrol/shared-validation';
import type { IdParamDto } from '@is-kontrol/shared-validation';
import { AddAddressCommand } from '../../../application/commands/addresses/add-address/add-address.command';
import { AddAddressHandler } from '../../../application/commands/addresses/add-address/add-address.handler';
import { UpdateAddressCommand } from '../../../application/commands/addresses/update-address/update-address.command';
import { UpdateAddressHandler } from '../../../application/commands/addresses/update-address/update-address.handler';
import { RemoveAddressCommand } from '../../../application/commands/addresses/remove-address/remove-address.command';
import { RemoveAddressHandler } from '../../../application/commands/addresses/remove-address/remove-address.handler';
import { SetDefaultAddressCommand } from '../../../application/commands/addresses/set-default-address/set-default-address.command';
import { SetDefaultAddressHandler } from '../../../application/commands/addresses/set-default-address/set-default-address.handler';
import { ListPartnerAddressesQuery } from '../../../application/queries/addresses/list-partner-addresses/list-partner-addresses.query';
import { ListPartnerAddressesHandler } from '../../../application/queries/addresses/list-partner-addresses/list-partner-addresses.handler';
import { CustomerDomainResultInterceptor } from '../domain-result.interceptor';
import { addAddressSchema, updateAddressSchema } from '../dto/addresses/address.dto';
import type { AddAddressDto, UpdateAddressDto } from '../dto/addresses/address.dto';

@ApiTags('addresses')
@Controller()
@UseInterceptors(CustomerDomainResultInterceptor)
export class PartnerAddressesController {
  constructor(
    private readonly addAddress: AddAddressHandler,
    private readonly updateAddress: UpdateAddressHandler,
    private readonly removeAddress: RemoveAddressHandler,
    private readonly setDefaultAddress: SetDefaultAddressHandler,
    private readonly listPartnerAddresses: ListPartnerAddressesHandler,
  ) {}

  @ZodBody(addAddressSchema)
  @Post('partners/:partnerId/addresses') @HttpCode(HttpStatus.CREATED)
  async add(@Param('partnerId', new ZodValidationPipe(idParamSchema)) partnerId: IdParamDto,
    @Body(new ZodValidationPipe(addAddressSchema)) body: AddAddressDto) {
    return this.addAddress.execute(new AddAddressCommand(
      partnerId, body.type, body.label ?? null, body.line1, body.line2 ?? null,
      body.city, body.district ?? null, body.postalCode ?? null, body.country,
      body.isDefault));
  }

  @Get('partners/:partnerId/addresses')
  async list(@Param('partnerId', new ZodValidationPipe(idParamSchema)) partnerId: IdParamDto) {
    return this.listPartnerAddresses.execute(new ListPartnerAddressesQuery(partnerId));
  }

  @ZodBody(updateAddressSchema)
  @Patch('addresses/:addressId')
  async update(@Param('addressId', new ZodValidationPipe(idParamSchema)) addressId: IdParamDto,
    @Body(new ZodValidationPipe(updateAddressSchema)) body: UpdateAddressDto) {
    return this.updateAddress.execute(new UpdateAddressCommand(
      addressId, body.type, body.label ?? null, body.line1, body.line2 ?? null,
      body.city, body.district ?? null, body.postalCode ?? null, body.country));
  }

  @Patch('addresses/:addressId/default') @HttpCode(HttpStatus.NO_CONTENT)
  async setDefault(@Param('addressId', new ZodValidationPipe(idParamSchema)) addressId: IdParamDto) {
    return this.setDefaultAddress.execute(new SetDefaultAddressCommand(addressId));
  }

  @Delete('addresses/:addressId') @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('addressId', new ZodValidationPipe(idParamSchema)) addressId: IdParamDto) {
    return this.removeAddress.execute(new RemoveAddressCommand(addressId));
  }
}
