import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

/**
 * Guard mixte : tente d'abord l'authentification JWT (cookie / Bearer JWT),
 * puis repli sur la stratégie API-key (Bearer gm_live_...).
 * Permet aux endpoints d'accepter les deux types de clients.
 *
 * Optionnel : décorer l'endpoint avec @RequirePermission('transactions:write')
 * pour vérifier les permissions de la clé API.
 */
export const REQUIRE_PERMISSION_KEY = 'require_permission';

export function RequirePermission(permission: string): MethodDecorator {
  return (target, key, descriptor) => {
    Reflect.defineMetadata(REQUIRE_PERMISSION_KEY, permission, descriptor.value as object);
    return descriptor;
  };
}

@Injectable()
export class JwtOrApiKeyGuard extends AuthGuard(['jwt', 'api-key']) {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest(err: any, user: any, _info: any, context: ExecutionContext): any {
    if (err || !user) {
      throw new UnauthorizedException('Authentification requise (JWT ou clé API)');
    }

    // Vérification de permission pour les clés API
    if (user['role'] === 'API_KEY') {
      const handler = context.getHandler();
      const requiredPerm = Reflect.getMetadata(REQUIRE_PERMISSION_KEY, handler) as string | undefined;
      if (requiredPerm) {
        const perms = (user['permissions'] as string[]) ?? [];
        if (!perms.includes(requiredPerm)) {
          throw new ForbiddenException(
            `Cette clé API n'a pas la permission "${requiredPerm}"`,
          );
        }
      }
    }

    return user;
  }
}
