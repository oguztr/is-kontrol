import { Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SHARED_AUTH_OPTIONS } from './shared-auth.options.js';
import type { SharedAuthOptions } from './shared-auth.options.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { PermissionsGuard } from './permissions.guard.js';

/* forRoot çağıran servisin TÜM HTTP endpoint'leri varsayılan olarak korunur
 * (JwtAuthGuard → PermissionsGuard sırasıyla). Muafiyet endpoint bazında
 * @Public() ile verilir — "korumayı unutma" hatası yerine "muafiyeti bilerek
 * açma" modeli. */
@Module({})
export class SharedAuthModule {
  static forRoot(options: SharedAuthOptions): DynamicModule {
    return {
      module: SharedAuthModule,
      global: true,
      providers: [
        { provide: SHARED_AUTH_OPTIONS, useValue: options },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: PermissionsGuard },
      ],
      exports: [SHARED_AUTH_OPTIONS],
    };
  }
}
