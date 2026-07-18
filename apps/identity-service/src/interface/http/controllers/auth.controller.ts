import { Body, Controller, Headers, HttpCode, HttpStatus, Ip, Post, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodBody } from '../openapi/zod-openapi';
import { ZodValidationPipe } from '@is-kontrol/shared-validation';
import { LoginCommand } from '../../../application/commands/auth/login/login.command';
import { LoginHandler } from '../../../application/commands/auth/login/login.handler';
import { RefreshTokenCommand } from '../../../application/commands/auth/refresh-token/refresh-token.command';
import { RefreshTokenHandler } from '../../../application/commands/auth/refresh-token/refresh-token.handler';
import { LogoutCommand } from '../../../application/commands/auth/logout/logout.command';
import { LogoutHandler } from '../../../application/commands/auth/logout/logout.handler';
import { ChangePasswordCommand } from '../../../application/commands/auth/change-password/change-password.command';
import { ChangePasswordHandler } from '../../../application/commands/auth/change-password/change-password.handler';
import { RequestPasswordResetCommand } from '../../../application/commands/auth/request-password-reset/request-password-reset.command';
import { RequestPasswordResetHandler } from '../../../application/commands/auth/request-password-reset/request-password-reset.handler';
import { ResetPasswordCommand } from '../../../application/commands/auth/reset-password/reset-password.command';
import { ResetPasswordHandler } from '../../../application/commands/auth/reset-password/reset-password.handler';
import { IdentityDomainResultInterceptor } from '../domain-result.interceptor';
import {
  changePasswordSchema, loginSchema, logoutSchema, refreshTokenSchema,
  requestPasswordResetSchema, resetPasswordSchema,
} from '../dto/auth/auth.dto';
import type {
  ChangePasswordDto, LoginDto, LogoutDto, RefreshTokenDto,
  RequestPasswordResetDto, ResetPasswordDto,
} from '../dto/auth/auth.dto';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(IdentityDomainResultInterceptor)
export class AuthController {
  constructor(
    private readonly login: LoginHandler,
    private readonly refreshToken: RefreshTokenHandler,
    private readonly logout: LogoutHandler,
    private readonly changePassword: ChangePasswordHandler,
    private readonly requestPasswordReset: RequestPasswordResetHandler,
    private readonly resetPassword: ResetPasswordHandler,
  ) {}

  @ZodBody(loginSchema)
  @Post('login') @HttpCode(HttpStatus.OK)
  async doLogin(@Body(new ZodValidationPipe(loginSchema)) body: LoginDto,
    @Headers('user-agent') userAgent: string | undefined, @Ip() ip: string) {
    return this.login.execute(new LoginCommand(
      body.email, body.password, userAgent ?? null, ip ?? null));
  }

  @ZodBody(refreshTokenSchema)
  @Post('refresh') @HttpCode(HttpStatus.OK)
  async doRefresh(@Body(new ZodValidationPipe(refreshTokenSchema)) body: RefreshTokenDto,
    @Headers('user-agent') userAgent: string | undefined, @Ip() ip: string) {
    return this.refreshToken.execute(new RefreshTokenCommand(
      body.refreshToken, userAgent ?? null, ip ?? null));
  }

  @ZodBody(logoutSchema)
  @Post('logout') @HttpCode(HttpStatus.NO_CONTENT)
  async doLogout(@Body(new ZodValidationPipe(logoutSchema)) body: LogoutDto) {
    return this.logout.execute(new LogoutCommand(body.refreshToken));
  }

  @ZodBody(changePasswordSchema)
  @Post('change-password') @HttpCode(HttpStatus.NO_CONTENT)
  async doChangePassword(
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordDto) {
    return this.changePassword.execute(new ChangePasswordCommand(
      body.userId, body.currentPassword, body.newPassword));
  }

  @ZodBody(requestPasswordResetSchema)
  @Post('password-reset/request') @HttpCode(HttpStatus.OK)
  async doRequestPasswordReset(
    @Body(new ZodValidationPipe(requestPasswordResetSchema)) body: RequestPasswordResetDto) {
    return this.requestPasswordReset.execute(
      new RequestPasswordResetCommand(body.email));
  }

  @ZodBody(resetPasswordSchema)
  @Post('password-reset/confirm') @HttpCode(HttpStatus.NO_CONTENT)
  async doResetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordDto) {
    return this.resetPassword.execute(new ResetPasswordCommand(
      body.token, body.newPassword));
  }
}
