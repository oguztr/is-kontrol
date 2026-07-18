import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'shared-auth:is-public';

/** Endpoint'i JWT zorunluluğundan muaf tutar (login, sign-up, health check). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
