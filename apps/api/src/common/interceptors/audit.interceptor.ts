import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';

/**
 * Journalise automatiquement les actions sensibles (§27 du cahier des charges).
 *
 * Principe : pour chaque requête MUTANTE réussie et authentifiée sur une route
 * métier, on écrit une entrée d'audit. L'écriture est en « fire-and-forget » :
 *  - elle est différée hors du cycle de réponse (`setImmediate`) — elle ne
 *    RALENTIT donc jamais la requête ;
 *  - toute erreur d'audit est avalée avec un simple warning — elle ne fait
 *    donc JAMAIS échouer l'action métier auditée.
 *
 * L'isolation multi-tenant est respectée : on ne journalise que le `tenantId`
 * de l'utilisateur courant (issu du JWT, jamais d'un paramètre client).
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  constructor(private readonly auditService: AuditService) {}

  /** Verbes HTTP mutants → action de l'enum `AuditAction`. */
  private static readonly ACTION_PAR_METHODE: Record<string, string> = {
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
  };

  /**
   * Ressources (premier segment de route) exclues de l'audit automatique :
   *  - `auth`         : LOGIN/LOGOUT/CREATE déjà journalisés dans AuthService
   *                     (avec la sémantique métier exacte) — éviter le doublon ;
   *  - `ai`           : trafic conversationnel non pertinent et volumineux ;
   *  - `webhooks`     : appels serveur-à-serveur, non imputables à un utilisateur ;
   *  - `notifications`: bruit (marquage lu/non-lu à haute fréquence) ;
   *  - `health`       : sonde de disponibilité ;
   *  - `reports`      : la génération/le téléchargement de rapport est un EXPORT,
   *                     journalisé explicitement dans ReportingController — on
   *                     l'exclut ici pour ne pas le tracer en double (CREATE).
   */
  private static readonly RESSOURCES_EXCLUES = new Set([
    'auth',
    'ai',
    'webhooks',
    'notifications',
    'health',
    'reports',
  ]);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method;
    const action = AuditInterceptor.ACTION_PAR_METHODE[method];

    // On ne trace que les mutations d'un utilisateur authentifié.
    const user = req.user;
    if (!action || !user?.tenantId) {
      return next.handle();
    }

    const resource = this.extraireRessource(req.originalUrl || req.url);
    if (!resource || AuditInterceptor.RESSOURCES_EXCLUES.has(resource)) {
      return next.handle();
    }

    // `tap` sur `next` ne se déclenche qu'en cas de succès (réponse 2xx) :
    // une action qui échoue n'est jamais auditée comme réussie.
    return next.handle().pipe(
      tap((reponse) => {
        this.enregistrer(action, resource, user, req, reponse);
      }),
    );
  }

  /**
   * Déclenche l'écriture d'audit SANS jamais bloquer ni faire échouer la
   * réponse HTTP : le travail est différé au tick suivant et toute erreur est
   * capturée localement.
   */
  private enregistrer(
    action: string,
    resource: string,
    user: { id?: string; tenantId: string },
    req: any,
    reponse: unknown,
  ): void {
    // Capturer les valeurs AVANT le tick différé (l'objet `req` peut être recyclé).
    const userId = user.id;
    const tenantId = user.tenantId;
    const ip = this.extraireIp(req);
    const userAgent =
      typeof req.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
    const resourceId = this.extraireResourceId(req, reponse);
    const details = { resourceId, method: req.method, path: req.originalUrl || req.url };

    setImmediate(() => {
      Promise.resolve(
        this.auditService.log(action, userId, resource, details, tenantId, ip, userAgent),
      ).catch((err) => {
        // L'audit est accessoire : on avale l'erreur pour ne pas polluer le flux.
        this.logger.warn(`Audit non enregistré (${action} ${resource}): ${err?.message ?? err}`);
      });
    });
  }

  /** Premier segment de route « métier », en ignorant le préfixe `api/v{n}`. */
  private extraireRessource(url: string): string | undefined {
    const chemin = url.split('?')[0];
    const segments = chemin.split('/').filter(Boolean);
    let i = 0;
    if (segments[i] === 'api') i++;
    if (/^v\d+$/i.test(segments[i] ?? '')) i++;
    return segments[i]?.toLowerCase();
  }

  /** Identifiant de la ressource affectée : réponse d'abord, sinon paramètres de route. */
  private extraireResourceId(req: any, reponse: any): string | undefined {
    if (reponse && typeof reponse === 'object') {
      if (typeof reponse.id === 'string') return reponse.id;
      if (reponse.data && typeof reponse.data.id === 'string') return reponse.data.id;
    }
    const params = req.params ?? {};
    return params.id ?? params.uuid ?? undefined;
  }

  /** IP réelle : `x-forwarded-for` (premier maillon) en priorité, sinon `req.ip`. */
  private extraireIp(req: any): string | undefined {
    const forwarded = req.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return String(forwarded[0]).trim();
    }
    return req.ip ?? undefined;
  }
}
