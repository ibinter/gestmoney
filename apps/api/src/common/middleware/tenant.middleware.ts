import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
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
    // Priorité 1 : header X-Tenant-ID explicite
    const headerTenantId = req.headers['x-tenant-id'] as string;
    if (headerTenantId) {
      req.tenantId = headerTenantId;
      return next();
    }

    // Priorité 2 : extraire du JWT Bearer token
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = this.jwtService.verify<any>(token, {
          secret: this.configService.get('jwt.secret'),
        });
        if (payload?.tenantId) {
          req.tenantId = payload.tenantId;
          return next();
        }
      } catch {
        // Token invalide ou expiré — continuer sans tenantId du JWT
      }
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
