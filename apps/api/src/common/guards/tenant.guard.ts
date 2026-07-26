import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant non identifié');
    }

    // Super admin peut accéder à tous les tenants
    if (user?.role === 'SUPER_ADMIN' || user?.roles?.includes?.('SUPER_ADMIN')) return true;

    // Vérifier que l'utilisateur appartient au tenant
    if (user && user.tenantId !== tenantId) {
      throw new ForbiddenException('Accès refusé à ce tenant');
    }

    return true;
  }
}
