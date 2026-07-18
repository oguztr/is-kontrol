import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodQueries } from '../openapi/zod-openapi';
import { ZodValidationPipe } from '@is-kontrol/shared-validation';
import { ListRolesQuery } from '../../../application/queries/roles/list-roles/list-roles.query';
import { ListRolesHandler } from '../../../application/queries/roles/list-roles/list-roles.handler';
import { IdentityDomainResultInterceptor } from '../domain-result.interceptor';
import { companyQuerySchema } from '../dto/companies/company.dto';
import type { CompanyQueryDto } from '../dto/companies/company.dto';

@ApiTags('roles')
@Controller('roles')
@UseInterceptors(IdentityDomainResultInterceptor)
export class RolesController {
  constructor(private readonly listRoles: ListRolesHandler) {}

  @ZodQueries(companyQuerySchema)
  @Get()
  async list(@Query(new ZodValidationPipe(companyQuerySchema)) query: CompanyQueryDto) {
    return this.listRoles.execute(new ListRolesQuery(query.companyId));
  }
}
