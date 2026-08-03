import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      impersonatedBy?: string;
      impersonationId?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const headerTenantId = req.headers['x-tenant-id'] as string | undefined;

    // Si un JWT est présent (cookie httpOnly ou Bearer), il fait autorité.
    // Le header X-Tenant-ID n'est accepté que s'il correspond EXACTEMENT
    // au tenantId du JWT — toute divergence est rejetée pour prévenir
    // les attaques de fuite inter-tenant.
    const cookieToken = (req.cookies as Record<string, string> | undefined)?.['gestmoney_token'];
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const token = cookieToken ?? bearerToken;
    if (token) {
      try {
        const jwtSecret = this.configService.get<string>('JWT_SECRET');
        if (!jwtSecret) throw new Error('JWT_SECRET non configuré');
        const payload = this.jwtService.verify<any>(token, {
          secret: jwtSecret,
        });
        if (payload?.tenantId) {
          if (headerTenantId && headerTenantId !== payload.tenantId) {
            throw new ForbiddenException('Cross-tenant access denied');
          }
          // La valeur vient du JWT vérifié, jamais du header brut.
          req.tenantId = payload.tenantId;

          // Propagation du contexte d'impersonation pour les logs d'audit
          if (payload.impersonatedBy) {
            req.impersonatedBy = payload.impersonatedBy;
            req.impersonationId = payload.impersonationId;
          }

          return next();
        }
      } catch (err: any) {
        if (err?.status === 403) throw err;
        // Token invalide ou expiré — continuer sans tenantId du JWT
      }
    }

    // Route publique (pas de JWT) : le header X-Tenant-ID est accepté tel quel.
    if (headerTenantId) {
      req.tenantId = headerTenantId;
      return next();
    }

    // Priorité 3 : sous-domaine (ex: tenant1.gestmoney.com)
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'api' && subdomain !== 'www' && subdomain !== 'localhost') {
      req.tenantId = subdomain;
      return next();
    }

    // Fallback : tenant par défaut
    req.tenantId = this.configService.get<string>('tenant.defaultTenantId', 'default');
    next();
  }
}
