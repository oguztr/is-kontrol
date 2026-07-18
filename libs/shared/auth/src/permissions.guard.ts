import { ForbiddenException, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './require-permission.decorator.js';
import type { AuthenticatedRequest } from './jwt-payload.js';

/* @RequirePermission('inventory:write') kontrolü. JwtAuthGuard'dan SONRA
 * çalışır (req.user dolu olmalı). İzin eşleşmesi: birebir, tam joker "*"
 * (süper-admin) veya kaynak jokeri "inventory:*". */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    if (!user) throw new ForbiddenException();

    const granted = new Set(user.permissions);
    const hasPermission = (permission: string): boolean => {
      if (granted.has(permission) || granted.has('*')) return true;
      const resource = permission.split(':')[0];
      return granted.has(`${resource}:*`);
    };

    if (!required.every(hasPermission)) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok');
    }
    return true;
  }
}
