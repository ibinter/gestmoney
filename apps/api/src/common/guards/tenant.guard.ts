import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant non identifié');
    }

    // Super admin peut accéder à tous les tenants
    if (user?.roles?.includes('SUPER_ADMIN')) return true;

    // Vérifier que l'utilisateur appartient au tenant
    if (user?.tenantId !== tenantId) {
      throw new ForbiddenException('Accès refusé à ce tenant');
    }

    return true;
  }
}
