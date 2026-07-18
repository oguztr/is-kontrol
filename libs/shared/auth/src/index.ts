export { SharedAuthModule } from './shared-auth.module.js';
export { SHARED_AUTH_OPTIONS } from './shared-auth.options.js';
export type { SharedAuthOptions } from './shared-auth.options.js';
export { JwtAuthGuard } from './jwt-auth.guard.js';
export { PermissionsGuard } from './permissions.guard.js';
export { Public, IS_PUBLIC_KEY } from './public.decorator.js';
export {
  RequirePermission,
  PERMISSIONS_KEY,
} from './require-permission.decorator.js';
export { CurrentUser } from './current-user.decorator.js';
export type {
  AccessTokenPayload,
  AuthenticatedUser,
  AuthenticatedRequest,
} from './jwt-payload.js';
