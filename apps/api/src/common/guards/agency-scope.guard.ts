import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const ADMIN_ROLES = ['SUPER_ADMIN', 'NETWORK_ADMIN'];
const AGENCY_ROLES = ['AGENCY_MANAGER', 'AGENT'];

/**
 * Guard d'isolation par agence.
 *
 * Ce guard n'interdit rien par lui-même : il enrichit `req.user` avec
 * `agenceId` (chaîne UUID de l'agence DB) et `agentId` (record Agent lié
 * à l'utilisateur) pour les rôles AGENCY_MANAGER et AGENT.
 *
 * Les services lisent ensuite `req.user.agenceId` pour filtrer leurs
 * requêtes Prisma et rejeter les mutations hors-périmètre.
 *
 * Usage dans un controller :
 *   @UseGuards(JwtAuthGuard, AgencyScopeGuard, RolesGuard)
 */
@Injectable()
export class AgencyScopeGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) return true; // laissé à JwtAuthGuard

    const roles: string[] = user.roles ?? [];

    // SUPER_ADMIN / NETWORK_ADMIN : accès total, pas d'enrichissement nécessaire
    if (roles.some((r) => ADMIN_ROLES.includes(r))) return true;

    // AGENCY_MANAGER / AGENT : récupérer leur agencyId depuis le record Agent
    if (roles.some((r) => AGENCY_ROLES.includes(r))) {
      const agent = await this.prisma.agent.findFirst({
        where: { userId: user.id, tenantId: user.tenantId },
        select: { id: true, agencyId: true },
      });
      req.user.agentId = agent?.id ?? null;
      req.user.agenceId = agent?.agencyId ?? null;
    }

    return true;
  }
}
