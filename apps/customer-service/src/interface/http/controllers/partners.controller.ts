import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodBody, ZodQueries } from '../openapi/zod-openapi';
import { ZodValidationPipe, idParamSchema } from '@is-kontrol/shared-validation';
import type { IdParamDto } from '@is-kontrol/shared-validation';
import { CreatePartnerCommand } from '../../../application/commands/partners/create-partner/create-partner.command';
import { CreatePartnerHandler } from '../../../application/commands/partners/create-partner/create-partner.handler';
import { UpdatePartnerCommand } from '../../../application/commands/partners/update-partner/update-partner.command';
import { UpdatePartnerHandler } from '../../../application/commands/partners/update-partner/update-partner.handler';
import { ExpandPartnerTypeCommand } from '../../../application/commands/partners/expand-partner-type/expand-partner-type.command';
import { ExpandPartnerTypeHandler } from '../../../application/commands/partners/expand-partner-type/expand-partner-type.handler';
import { ChangePartnerStatusCommand } from '../../../application/commands/partners/change-partner-status/change-partner-status.command';
import { ChangePartnerStatusHandler } from '../../../application/commands/partners/change-partner-status/change-partner-status.handler';
import { UpdateSalesFunnelStageCommand } from '../../../application/commands/partners/update-sales-funnel-stage/update-sales-funnel-stage.command';
import { UpdateSalesFunnelStageHandler } from '../../../application/commands/partners/update-sales-funnel-stage/update-sales-funnel-stage.handler';
import { AssignPartnerCommand } from '../../../application/commands/partners/assign-partner/assign-partner.command';
import { AssignPartnerHandler } from '../../../application/commands/partners/assign-partner/assign-partner.handler';
import { AddPartnerTagCommand } from '../../../application/commands/partners/add-partner-tag/add-partner-tag.command';
import { AddPartnerTagHandler } from '../../../application/commands/partners/add-partner-tag/add-partner-tag.handler';
import { RemovePartnerTagCommand } from '../../../application/commands/partners/remove-partner-tag/remove-partner-tag.command';
import { RemovePartnerTagHandler } from '../../../application/commands/partners/remove-partner-tag/remove-partner-tag.handler';
import { DeletePartnerCommand } from '../../../application/commands/partners/delete-partner/delete-partner.command';
import { DeletePartnerHandler } from '../../../application/commands/partners/delete-partner/delete-partner.handler';
import { MergePartnersCommand } from '../../../application/commands/partners/merge-partners/merge-partners.command';
import { MergePartnersHandler } from '../../../application/commands/partners/merge-partners/merge-partners.handler';
import { UpsertCompanyProfileCommand } from '../../../application/commands/company-profiles/upsert-company-profile/upsert-company-profile.command';
import { UpsertCompanyProfileHandler } from '../../../application/commands/company-profiles/upsert-company-profile/upsert-company-profile.handler';
import { GetPartnerQuery } from '../../../application/queries/partners/get-partner/get-partner.query';
import { GetPartnerHandler } from '../../../application/queries/partners/get-partner/get-partner.handler';
import { ListPartnersQuery } from '../../../application/queries/partners/list-partners/list-partners.query';
import { ListPartnersHandler } from '../../../application/queries/partners/list-partners/list-partners.handler';
import { FindDuplicatePartnersQuery } from '../../../application/queries/partners/find-duplicate-partners/find-duplicate-partners.query';
import { FindDuplicatePartnersHandler } from '../../../application/queries/partners/find-duplicate-partners/find-duplicate-partners.handler';
import { GetPartnerTimelineQuery } from '../../../application/queries/partners/get-partner-timeline/get-partner-timeline.query';
import { GetPartnerTimelineHandler } from '../../../application/queries/partners/get-partner-timeline/get-partner-timeline.handler';
import { CustomerDomainResultInterceptor } from '../domain-result.interceptor';
import {
  addPartnerTagSchema, assignPartnerSchema, changePartnerStatusSchema,
  companyQuerySchema, createPartnerSchema, expandPartnerTypeSchema,
  mergePartnersSchema, partnerListQuerySchema, updatePartnerSchema,
  updateSalesFunnelStageSchema, upsertCompanyProfileSchema,
} from '../dto/partners/partner.dto';
import type {
  AddPartnerTagDto, AssignPartnerDto, ChangePartnerStatusDto, CompanyQueryDto,
  CreatePartnerDto, ExpandPartnerTypeDto, MergePartnersDto, PartnerListQueryDto,
  UpdatePartnerDto, UpdateSalesFunnelStageDto, UpsertCompanyProfileDto,
} from '../dto/partners/partner.dto';

@ApiTags('partners')
@Controller('partners')
@UseInterceptors(CustomerDomainResultInterceptor)
export class PartnersController {
  constructor(
    private readonly createPartner: CreatePartnerHandler,
    private readonly updatePartner: UpdatePartnerHandler,
    private readonly expandPartnerType: ExpandPartnerTypeHandler,
    private readonly changePartnerStatus: ChangePartnerStatusHandler,
    private readonly updateSalesFunnelStage: UpdateSalesFunnelStageHandler,
    private readonly assignPartner: AssignPartnerHandler,
    private readonly addPartnerTag: AddPartnerTagHandler,
    private readonly removePartnerTag: RemovePartnerTagHandler,
    private readonly deletePartner: DeletePartnerHandler,
    private readonly mergePartners: MergePartnersHandler,
    private readonly upsertCompanyProfile: UpsertCompanyProfileHandler,
    private readonly getPartner: GetPartnerHandler,
    private readonly listPartners: ListPartnersHandler,
    private readonly findDuplicatePartners: FindDuplicatePartnersHandler,
    private readonly getPartnerTimeline: GetPartnerTimelineHandler,
  ) {}

  @ZodBody(createPartnerSchema)
  @Post() @HttpCode(HttpStatus.CREATED)
  async create(@Body(new ZodValidationPipe(createPartnerSchema)) body: CreatePartnerDto) {
    return this.createPartner.execute(new CreatePartnerCommand(
      body.companyId, body.name, body.type, body.kind,
      body.assignedUserId ?? null, body.tags, body.createdBy ?? null));
  }

  @ZodQueries(partnerListQuerySchema)
  @Get()
  async list(@Query(new ZodValidationPipe(partnerListQuerySchema)) query: PartnerListQueryDto) {
    return this.listPartners.execute(new ListPartnersQuery(
      query.companyId, query.type, query.status, query.stage, query.assignedUserId,
      query.tag, query.createdFrom, query.createdTo, query.search, query.kind));
  }

  @ZodQueries(companyQuerySchema)
  @Get('duplicates')
  async duplicates(@Query(new ZodValidationPipe(companyQuerySchema)) query: CompanyQueryDto) {
    return this.findDuplicatePartners.execute(new FindDuplicatePartnersQuery(query.companyId));
  }

  @Get(':id')
  async get(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.getPartner.execute(new GetPartnerQuery(id));
  }

  @Get(':id/timeline')
  async timeline(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.getPartnerTimeline.execute(new GetPartnerTimelineQuery(id));
  }

  @ZodBody(updatePartnerSchema)
  @Patch(':id')
  async update(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(updatePartnerSchema)) body: UpdatePartnerDto) {
    return this.updatePartner.execute(new UpdatePartnerCommand(id, body.name));
  }

  @ZodBody(expandPartnerTypeSchema)
  @Patch(':id/type') @HttpCode(HttpStatus.NO_CONTENT)
  async expandType(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(expandPartnerTypeSchema)) body: ExpandPartnerTypeDto) {
    return this.expandPartnerType.execute(new ExpandPartnerTypeCommand(id, body.type));
  }

  @ZodBody(changePartnerStatusSchema)
  @Patch(':id/status') @HttpCode(HttpStatus.NO_CONTENT)
  async changeStatus(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(changePartnerStatusSchema)) body: ChangePartnerStatusDto) {
    return this.changePartnerStatus.execute(new ChangePartnerStatusCommand(id, body.status));
  }

  @ZodBody(updateSalesFunnelStageSchema)
  @Patch(':id/funnel-stage') @HttpCode(HttpStatus.NO_CONTENT)
  async changeFunnelStage(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(updateSalesFunnelStageSchema)) body: UpdateSalesFunnelStageDto) {
    return this.updateSalesFunnelStage.execute(new UpdateSalesFunnelStageCommand(id, body.stage));
  }

  @ZodBody(assignPartnerSchema)
  @Patch(':id/assignee') @HttpCode(HttpStatus.NO_CONTENT)
  async assign(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(assignPartnerSchema)) body: AssignPartnerDto) {
    return this.assignPartner.execute(new AssignPartnerCommand(id, body.assignedUserId));
  }

  @ZodBody(addPartnerTagSchema)
  @Post(':id/tags') @HttpCode(HttpStatus.NO_CONTENT)
  async addTag(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(addPartnerTagSchema)) body: AddPartnerTagDto) {
    return this.addPartnerTag.execute(new AddPartnerTagCommand(id, body.tag));
  }

  @Delete(':id/tags/:tag') @HttpCode(HttpStatus.NO_CONTENT)
  async removeTag(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Param('tag') tag: string) {
    return this.removePartnerTag.execute(new RemovePartnerTagCommand(id, tag));
  }

  @ZodBody(mergePartnersSchema)
  @Post(':id/merge') @HttpCode(HttpStatus.NO_CONTENT)
  async merge(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(mergePartnersSchema)) body: MergePartnersDto) {
    return this.mergePartners.execute(new MergePartnersCommand(id, body.sourcePartnerId));
  }

  @ZodBody(upsertCompanyProfileSchema)
  @Put(':id/company-profile')
  async putCompanyProfile(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(upsertCompanyProfileSchema)) body: UpsertCompanyProfileDto) {
    return this.upsertCompanyProfile.execute(new UpsertCompanyProfileCommand(
      id, body.tradeName, body.taxNumber ?? null, body.taxOffice ?? null,
      body.industry ?? null, body.website ?? null, body.parentPartnerId ?? null,
      body.paymentTermDays ?? null, body.preferredCurrencyCode ?? null));
  }

  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.deletePartner.execute(new DeletePartnerCommand(id));
  }
}
