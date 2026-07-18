import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodBody, ZodQueries } from '../openapi/zod-openapi';
import { ZodValidationPipe, idParamSchema } from '@is-kontrol/shared-validation';
import type { IdParamDto } from '@is-kontrol/shared-validation';
import { InviteUserCommand } from '../../../application/commands/users/invite-user/invite-user.command';
import { InviteUserHandler } from '../../../application/commands/users/invite-user/invite-user.handler';
import { AcceptInvitationCommand } from '../../../application/commands/users/accept-invitation/accept-invitation.command';
import { AcceptInvitationHandler } from '../../../application/commands/users/accept-invitation/accept-invitation.handler';
import { RevokeInvitationCommand } from '../../../application/commands/users/revoke-invitation/revoke-invitation.command';
import { RevokeInvitationHandler } from '../../../application/commands/users/revoke-invitation/revoke-invitation.handler';
import { UpdateUserProfileCommand } from '../../../application/commands/users/update-user-profile/update-user-profile.command';
import { UpdateUserProfileHandler } from '../../../application/commands/users/update-user-profile/update-user-profile.handler';
import { DeactivateUserCommand } from '../../../application/commands/users/deactivate-user/deactivate-user.command';
import { DeactivateUserHandler } from '../../../application/commands/users/deactivate-user/deactivate-user.handler';
import { ReactivateUserCommand } from '../../../application/commands/users/reactivate-user/reactivate-user.command';
import { ReactivateUserHandler } from '../../../application/commands/users/reactivate-user/reactivate-user.handler';
import { DeleteUserCommand } from '../../../application/commands/users/delete-user/delete-user.command';
import { DeleteUserHandler } from '../../../application/commands/users/delete-user/delete-user.handler';
import { AssignRoleCommand } from '../../../application/commands/users/assign-role/assign-role.command';
import { AssignRoleHandler } from '../../../application/commands/users/assign-role/assign-role.handler';
import { ListUsersQuery } from '../../../application/queries/users/list-users/list-users.query';
import { ListUsersHandler } from '../../../application/queries/users/list-users/list-users.handler';
import { ListInvitationsQuery } from '../../../application/queries/users/list-invitations/list-invitations.query';
import { ListInvitationsHandler } from '../../../application/queries/users/list-invitations/list-invitations.handler';
import { IdentityDomainResultInterceptor } from '../domain-result.interceptor';
import { companyQuerySchema } from '../dto/companies/company.dto';
import type { CompanyQueryDto } from '../dto/companies/company.dto';
import {
  acceptInvitationSchema, assignRoleSchema, inviteUserSchema,
  updateUserProfileSchema,
} from '../dto/users/user.dto';
import type {
  AcceptInvitationDto, AssignRoleDto, InviteUserDto, UpdateUserProfileDto,
} from '../dto/users/user.dto';

@ApiTags('users')
@Controller('users')
@UseInterceptors(IdentityDomainResultInterceptor)
export class UsersController {
  constructor(
    private readonly inviteUser: InviteUserHandler,
    private readonly acceptInvitation: AcceptInvitationHandler,
    private readonly revokeInvitation: RevokeInvitationHandler,
    private readonly updateUserProfile: UpdateUserProfileHandler,
    private readonly deactivateUser: DeactivateUserHandler,
    private readonly reactivateUser: ReactivateUserHandler,
    private readonly deleteUser: DeleteUserHandler,
    private readonly assignRole: AssignRoleHandler,
    private readonly listUsers: ListUsersHandler,
    private readonly listInvitations: ListInvitationsHandler,
  ) {}

  @ZodQueries(companyQuerySchema)
  @Get()
  async list(@Query(new ZodValidationPipe(companyQuerySchema)) query: CompanyQueryDto) {
    return this.listUsers.execute(new ListUsersQuery(query.companyId));
  }

  @ZodBody(inviteUserSchema)
  @Post('invitations') @HttpCode(HttpStatus.CREATED)
  async invite(@Body(new ZodValidationPipe(inviteUserSchema)) body: InviteUserDto) {
    return this.inviteUser.execute(new InviteUserCommand(
      body.companyId, body.email, body.roleId, body.invitedByUserId ?? null));
  }

  @ZodQueries(companyQuerySchema)
  @Get('invitations')
  async listPendingInvitations(
    @Query(new ZodValidationPipe(companyQuerySchema)) query: CompanyQueryDto) {
    return this.listInvitations.execute(new ListInvitationsQuery(query.companyId));
  }

  /** Public: davet linkinden gelinir; kullanıcı burada şifresiyle doğar. */
  @ZodBody(acceptInvitationSchema)
  @Post('invitations/accept') @HttpCode(HttpStatus.CREATED)
  async accept(@Body(new ZodValidationPipe(acceptInvitationSchema)) body: AcceptInvitationDto) {
    return this.acceptInvitation.execute(new AcceptInvitationCommand(
      body.token, body.password, body.firstName, body.lastName,
      body.phone ?? null));
  }

  @Delete('invitations/:id') @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.revokeInvitation.execute(new RevokeInvitationCommand(id));
  }

  @ZodBody(updateUserProfileSchema)
  @Patch(':id/profile')
  async updateProfile(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(updateUserProfileSchema)) body: UpdateUserProfileDto) {
    return this.updateUserProfile.execute(new UpdateUserProfileCommand(
      id, body.firstName ?? null, body.lastName ?? null,
      body.phone ?? null, body.avatarUrl ?? null));
  }

  @ZodBody(assignRoleSchema)
  @Patch(':id/role') @HttpCode(HttpStatus.NO_CONTENT)
  async changeRole(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto,
    @Body(new ZodValidationPipe(assignRoleSchema)) body: AssignRoleDto) {
    return this.assignRole.execute(new AssignRoleCommand(id, body.roleId));
  }

  @Post(':id/deactivate') @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.deactivateUser.execute(new DeactivateUserCommand(id));
  }

  @Post(':id/reactivate') @HttpCode(HttpStatus.NO_CONTENT)
  async reactivate(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.reactivateUser.execute(new ReactivateUserCommand(id));
  }

  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', new ZodValidationPipe(idParamSchema)) id: IdParamDto) {
    return this.deleteUser.execute(new DeleteUserCommand(id));
  }
}
