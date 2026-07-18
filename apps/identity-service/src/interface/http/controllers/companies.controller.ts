import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodBody } from '../openapi/zod-openapi';
import { ZodValidationPipe, idParamSchema } from '@is-kontrol/shared-validation';
import type { IdParamDto } from '@is-kontrol/shared-validation';
import { SignUpCommand } from '../../../application/commands/companies/sign-up/sign-up.command';
import { SignUpHandler } from '../../../application/commands/companies/sign-up/sign-up.handler';
import { UpdateCompanyCommand } from '../../../application/commands/companies/update-company/update-company.command';
import { UpdateCompanyHandler } from '../../../application/commands/companies/update-company/update-company.handler';
import { SuspendCompanyCommand } from '../../../application/commands/companies/suspend-company/suspend-company.command';
import { SuspendCompanyHandler } from '../../../application/commands/companies/suspend-company/suspend-company.handler';
import { ReactivateCompanyCommand } from '../../../application/commands/companies/reactivate-company/reactivate-company.command';
import { ReactivateCompanyHandler } from '../../../application/commands/companies/reactivate-company/reactivate-company.handler';
import { DeleteCompanyCommand } from '../../../application/commands/companies/delete-company/delete-company.command';
import { DeleteCompanyHandler } from '../../../application/commands/companies/delete-company/delete-company.handler';
import { GetCompanyQuery } from '../../../application/queries/companies/get-company/get-company.query';
import { GetCompanyHandler } from '../../../application/queries/companies/get-company/get-company.handler';
import { IdentityDomainResultInterceptor } from '../domain-result.interceptor';
import { signUpSchema, updateCompanySchema } from '../dto/companies/company.dto';
import type { SignUpDto, UpdateCompanyDto } from '../dto/companies/company.dto';

@ApiTags('companies')
@Controller('companies')
@UseInterceptors(IdentityDomainResultInterceptor)
export class CompaniesController {
  constructor(
    private readonly signUp: SignUpHandler,
    private readonly updateCompany: UpdateCompanyHandler,
    private readonly suspendCompany: SuspendCompanyHandler,
    private readonly reactivateCompany: ReactivateCompanyHandler,
    private readonly deleteCompany: DeleteCompanyHandler,
    private readonly getCompany: GetCompanyHandler,
  ) {}

  /** Public: firma + OWNER rolündeki ilk kullanıcı tek işlemde oluşur. */
  @ZodBody(signUpSchema)
  @Post('sign-up') @HttpCode(HttpStatus.CREATED)
  async doSignUp(@Body(new ZodValidationPipe(signUpSchema)) body: SignUpDto) {
    return this.signUp.execute(new SignUpCommand(
      body.companyName, body.baseCurrencyCode, body.timezone, body.locale,
      body.email, body.password, body.firstName, body.lastName));
  }

  @Get(':id')
  async get(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.getCompany.execute(new GetCompanyQuery(id));
  }

  @ZodBody(updateCompanySchema)
  @Patch(':id')
  async update(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(updateCompanySchema)) body: UpdateCompanyDto) {
    return this.updateCompany.execute(new UpdateCompanyCommand(
      id, body.name ?? null, body.baseCurrencyCode ?? null,
      body.timezone ?? null, body.locale ?? null));
  }

  @Post(':id/suspend') @HttpCode(HttpStatus.NO_CONTENT)
  async suspend(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.suspendCompany.execute(new SuspendCompanyCommand(id));
  }

  @Post(':id/reactivate') @HttpCode(HttpStatus.NO_CONTENT)
  async reactivate(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.reactivateCompany.execute(new ReactivateCompanyCommand(id));
  }

  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.deleteCompany.execute(new DeleteCompanyCommand(id));
  }
}
