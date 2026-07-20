import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { SANS_LICENCE_KEY } from '../common/decorators/sans-licence.decorator';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { RoleType } from '../common/enums/role.enum';
import { LicencesService } from './licences.service';
import { StatutLicence, StatutLicenceResultat } from './dto/licences.dto';

/** Nom du cookie httpOnly posé à la connexion (cf. `auth/strategies/jwt.strategy.ts`). */
const COOKIE_TOKEN = 'gestmoney_token';

/**
 * Statuts qui ouvrent l'accès à l'application.
 *
 * GRACE en fait PARTIE : la période de grâce existe précisément pour laisser au
 * client le temps de renouveler sans interruption de service. La retirer d'ici
 * viderait la fonctionnalité de son sens.
 */
const STATUTS_AUTORISES: ReadonlySet<StatutLicence> = new Set([
  StatutLicence.ESSAI,
  StatutLicence.PROVISOIRE,
  StatutLicence.ACTIVE,
  StatutLicence.GRACE,
]);

/** Corps de la réponse 402, exploité par le front pour rediriger et expliquer. */
export interface CorpsLicenceRefusee {
  statusCode: number;
  error: string;
  code: 'LICENCE_INACTIVE';
  message: string;
  statut: StatutLicence;
  /** Échéance dépassée (ou date de révocation/suspension) si connue. */
  dateFin: string | null;
  motif: string | null;
  /** Où l'utilisateur peut régulariser — le front s'appuie dessus. */
  renouvellementUrl: string;
}

const URL_RENOUVELLEMENT = '/dashboard/abonnement';

const MESSAGES: Record<string, string> = {
  [StatutLicence.EN_ATTENTE_PAIEMENT]:
    "Votre abonnement est en attente de paiement. Réglez-le pour ouvrir l'accès.",
  [StatutLicence.EXPIREE]:
    'Votre abonnement a expiré. Renouvelez-le pour retrouver l’accès.',
  [StatutLicence.SUSPENDUE]:
    'Votre abonnement est suspendu. Contactez le support ou régularisez votre situation.',
  [StatutLicence.REVOQUEE]:
    'Votre licence a été révoquée. Contactez le support pour ouvrir un nouvel abonnement.',
};

/**
 * Garde globale d'application de la licence.
 *
 * ── Pourquoi globale ────────────────────────────────────────────────────────
 * « Sécurisé par défaut » : enregistrée via `APP_GUARD`, elle couvre tout
 * module présent ET futur. L'inverse (l'ajouter contrôleur par contrôleur)
 * garantit qu'un module créé plus tard sera oublié, et rouvrira la fuite.
 *
 * ── Pourquoi elle ne lit pas seulement `req.user` ───────────────────────────
 * Nest exécute les gardes globales AVANT les gardes de contrôleur. Or
 * `JwtAuthGuard` est posé par `@UseGuards(...)` sur chaque contrôleur : au
 * moment où cette garde s'exécute, Passport n'a donc PAS encore rempli
 * `req.user`. S'en remettre à `req.user` seul ferait passer 100 % des requêtes
 * — la garde serait cosmétique. On lit donc `req.user` s'il est déjà là (au cas
 * où l'ordre changerait un jour), sinon on décode le JWT nous-mêmes, en
 * lecture seule et sans jamais lever d'erreur d'authentification.
 *
 * ── Elle n'authentifie PAS ──────────────────────────────────────────────────
 * Token absent, illisible ou expiré ⇒ on laisse passer. Ce n'est pas le rôle de
 * cette garde de renvoyer un 401 : `JwtAuthGuard`, qui s'exécute juste après,
 * s'en charge, et une route réellement publique doit rester publique.
 */
@Injectable()
export class LicenceGuard implements CanActivate {
  private readonly logger = new Logger(LicenceGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly licences: LicencesService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Hors HTTP (WebSocket, tâches planifiées, microservices) : hors périmètre.
    if (context.getType() !== 'http') return true;

    const exempte = this.reflector.getAllAndOverride<boolean>(SANS_LICENCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (exempte) return true;

    // Une route explicitement publique n'a pas de tenant à contrôler.
    const estPublique = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (estPublique) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const identite = this.resoudreIdentite(request);

    // Pas d'identité exploitable ⇒ route publique ou requête non authentifiée :
    // laisser passer, `JwtAuthGuard` tranchera.
    if (!identite?.tenantId) return true;

    // Le SUPER_ADMIN administre la plateforme, pas un abonnement : le bloquer
    // sur l'état de son propre tenant le priverait des consoles depuis
    // lesquelles il réactive justement les licences des autres.
    if (identite.roles?.includes(RoleType.SUPER_ADMIN)) return true;

    let statut: StatutLicenceResultat;
    try {
      statut = await this.licences.getStatutLicenceCache(identite.tenantId);
    } catch (erreur) {
      // Tenant introuvable ou base indisponible : on ne transforme pas une
      // panne d'infrastructure en refus de paiement généralisé. On journalise
      // et on laisse la requête suivre son cours (les autres gardes restent).
      const message = erreur instanceof Error ? erreur.message : String(erreur);
      this.logger.warn(
        `Statut de licence illisible pour le tenant ${identite.tenantId} : ${message}`,
      );
      return true;
    }

    if (STATUTS_AUTORISES.has(statut.statut)) return true;

    throw new HttpException(this.construireCorps(statut), HttpStatus.PAYMENT_REQUIRED);
  }

  /** Échéance la plus pertinente à afficher selon le statut refusé. */
  private construireCorps(statut: StatutLicenceResultat): CorpsLicenceRefusee {
    const dateFin =
      statut.subscriptionEndsAt ??
      statut.graceJusquA ??
      statut.provisoireJusquA ??
      statut.trialEndsAt ??
      null;

    return {
      statusCode: HttpStatus.PAYMENT_REQUIRED,
      error: 'Payment Required',
      code: 'LICENCE_INACTIVE',
      message:
        MESSAGES[statut.statut] ??
        'Votre licence ne permet plus l’accès à l’application.',
      statut: statut.statut,
      dateFin: dateFin ? new Date(dateFin).toISOString() : null,
      motif: statut.motif ?? null,
      renouvellementUrl: URL_RENOUVELLEMENT,
    };
  }

  /**
   * Récupère `tenantId` / `roles` sans jamais rejeter la requête.
   * `req.user` d'abord (si une garde d'authentification a déjà tourné), sinon
   * décodage vérifié du JWT porté par le cookie httpOnly ou l'en-tête Bearer.
   */
  private resoudreIdentite(
    request: Request,
  ): { tenantId?: string; roles?: string[] } | null {
    const utilisateur = (request as Request & {
      user?: { tenantId?: string; roles?: string[] };
    }).user;
    if (utilisateur?.tenantId) return utilisateur;

    const token = this.extraireToken(request);
    if (!token) return null;

    try {
      const charge = this.jwtService.verify<{ tenantId?: string; roles?: string[] }>(
        token,
        {
          secret: this.config.get<string>(
            'JWT_SECRET',
            'gestmoney-super-secret-jwt-key-for-dev-32chars!',
          ),
        },
      );
      return { tenantId: charge?.tenantId, roles: charge?.roles };
    } catch {
      // Token expiré ou falsifié : ce n'est pas notre problème (401 plus loin).
      return null;
    }
  }

  private extraireToken(request: Request): string | null {
    const depuisCookie = (request?.cookies as Record<string, string> | undefined)?.[
      COOKIE_TOKEN
    ];
    if (depuisCookie) return depuisCookie;

    const entete = request?.headers?.authorization;
    if (typeof entete === 'string' && entete.toLowerCase().startsWith('bearer ')) {
      return entete.slice(7).trim() || null;
    }
    return null;
  }
}
