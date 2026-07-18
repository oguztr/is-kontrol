import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, AuthenticatedUser } from './jwt-payload.js';

/** Controller parametresine doğrulanmış kullanıcıyı verir:
 *  `@CurrentUser() user: AuthenticatedUser` ya da tek alan için
 *  `@CurrentUser('companyId') companyId: string`. */
export const CurrentUser = createParamDecorator(
  (
    field: keyof AuthenticatedUser | undefined,
    context: ExecutionContext,
  ): AuthenticatedUser | AuthenticatedUser[keyof AuthenticatedUser] => {
    const { user } = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    if (!user) {
      // JwtAuthGuard atlanmışsa (yanlış konfigürasyon) sessizce undefined
      // dönmek yerine erken ve gürültülü patla.
      throw new Error(
        '@CurrentUser kullanılan endpoint JwtAuthGuard ile korunmalı',
      );
    }
    return field ? user[field] : user;
  },
);
