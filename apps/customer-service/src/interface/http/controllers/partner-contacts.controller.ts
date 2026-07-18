import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodBody, ZodQueries } from '../openapi/zod-openapi';
import { ZodValidationPipe, idParamSchema } from '@is-kontrol/shared-validation';
import type { IdParamDto } from '@is-kontrol/shared-validation';
import { AddContactCommand } from '../../../application/commands/contacts/add-contact/add-contact.command';
import { AddContactHandler } from '../../../application/commands/contacts/add-contact/add-contact.handler';
import { UpdateContactCommand } from '../../../application/commands/contacts/update-contact/update-contact.command';
import { UpdateContactHandler } from '../../../application/commands/contacts/update-contact/update-contact.handler';
import { RemoveContactCommand } from '../../../application/commands/contacts/remove-contact/remove-contact.command';
import { RemoveContactHandler } from '../../../application/commands/contacts/remove-contact/remove-contact.handler';
import { SetPrimaryContactCommand } from '../../../application/commands/contacts/set-primary-contact/set-primary-contact.command';
import { SetPrimaryContactHandler } from '../../../application/commands/contacts/set-primary-contact/set-primary-contact.handler';
import { ListPartnerContactsQuery } from '../../../application/queries/contacts/list-partner-contacts/list-partner-contacts.query';
import { ListPartnerContactsHandler } from '../../../application/queries/contacts/list-partner-contacts/list-partner-contacts.handler';
import { SearchContactsQuery } from '../../../application/queries/contacts/search-contacts/search-contacts.query';
import { SearchContactsHandler } from '../../../application/queries/contacts/search-contacts/search-contacts.handler';
import { CustomerDomainResultInterceptor } from '../domain-result.interceptor';
import { addContactSchema, contactSearchQuerySchema, updateContactSchema } from '../dto/contacts/contact.dto';
import type { AddContactDto, ContactSearchQueryDto, UpdateContactDto } from '../dto/contacts/contact.dto';

@ApiTags('contacts')
@Controller()
@UseInterceptors(CustomerDomainResultInterceptor)
export class PartnerContactsController {
  constructor(
    private readonly addContact: AddContactHandler,
    private readonly updateContact: UpdateContactHandler,
    private readonly removeContact: RemoveContactHandler,
    private readonly setPrimaryContact: SetPrimaryContactHandler,
    private readonly listPartnerContacts: ListPartnerContactsHandler,
    private readonly searchContacts: SearchContactsHandler,
  ) {}

  // Telefon/e-posta ile çapraz arama (partner'dan bağımsız).
  @ZodQueries(contactSearchQuerySchema)
  @Get('contacts/search')
  async search(@Query(new ZodValidationPipe(contactSearchQuerySchema)) query: ContactSearchQueryDto) {
    return this.searchContacts.execute(
      new SearchContactsQuery(query.companyId, query.phone, query.email));
  }

  @ZodBody(addContactSchema)
  @Post('partners/:partnerId/contacts') @HttpCode(HttpStatus.CREATED)
  async add(@Param('partnerId', new ZodValidationPipe(idParamSchema)) partnerId: IdParamDto,
    @Body(new ZodValidationPipe(addContactSchema)) body: AddContactDto) {
    return this.addContact.execute(new AddContactCommand(
      partnerId, body.firstName, body.lastName, body.title ?? null,
      body.department ?? null, body.phone ?? null, body.email ?? null, body.isPrimary));
  }

  @Get('partners/:partnerId/contacts')
  async list(@Param('partnerId', new ZodValidationPipe(idParamSchema)) partnerId: IdParamDto) {
    return this.listPartnerContacts.execute(new ListPartnerContactsQuery(partnerId));
  }

  @ZodBody(updateContactSchema)
  @Patch('contacts/:contactId')
  async update(@Param('contactId', new ZodValidationPipe(idParamSchema)) contactId: IdParamDto,
    @Body(new ZodValidationPipe(updateContactSchema)) body: UpdateContactDto) {
    return this.updateContact.execute(new UpdateContactCommand(
      contactId, body.firstName, body.lastName, body.title ?? null,
      body.department ?? null, body.phone ?? null, body.email ?? null));
  }

  @Patch('contacts/:contactId/primary') @HttpCode(HttpStatus.NO_CONTENT)
  async setPrimary(@Param('contactId', new ZodValidationPipe(idParamSchema)) contactId: IdParamDto) {
    return this.setPrimaryContact.execute(new SetPrimaryContactCommand(contactId));
  }

  @Delete('contacts/:contactId') @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('contactId', new ZodValidationPipe(idParamSchema)) contactId: IdParamDto) {
    return this.removeContact.execute(new RemoveContactCommand(contactId));
  }
}
