import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Applique des directives Cache-Control adaptées selon la nature de la route.
 *
 * - Routes de santé / statut   → cache public court (30 s) avec stale-while-revalidate
 * - Routes sensibles (finance) → no-store strict (aucune mise en cache côté proxy ou navigateur)
 * - Toutes les autres routes   → private, no-cache (revalidation obligatoire, pas de proxy)
 *
 * À enregistrer globalement dans AppModule ou dans chaque module concerné :
 *   providers: [{ provide: APP_INTERCEPTOR, useClass: CacheControlInterceptor }]
 */
@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const res = http.getResponse<{ setHeader: (k: string, v: string) => void }>();
    const req = http.getRequest<{ url: string }>();

    const url = req.url;

    if (url.includes('/health') || url.includes('/status')) {
      // Résultats stables → cache public court avec stale-while-revalidate
      res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    } else if (
      url.includes('/transactions') ||
      url.includes('/float') ||
      url.includes('/cashier') ||
      url.includes('/commissions') ||
      url.includes('/accounting')
    ) {
      // Données financières → aucune mise en cache, jamais
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
    } else {
      // API par défaut → pas de cache partagé (sécurité multi-tenant)
      res.setHeader('Cache-Control', 'private, no-cache');
    }

    return next.handle();
  }
}
