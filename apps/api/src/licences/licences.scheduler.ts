import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaiementStatut, TenantStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LicencesService } from './licences.service';
import { StatutLicence } from './dto/licences.dto';

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

/** Compte rendu d'exécution d'une tâche planifiée. */
export interface RapportTache {
  tache: string;
  examines: number;
  traites: number;
  erreurs: number;
}

/**
 * Tâches planifiées du cycle de vie des licences.
 *
 * IDEMPOTENCE — chaque tâche peut être relancée sans effet de bord :
 *  - les transitions passent par LicencesService, qui vérifie l'état courant
 *    avant d'écrire et renvoie `false` si la transition est déjà faite ;
 *  - les rappels sont verrouillés par `marquerRappelEnvoye`, indexé sur le
 *    cycle d'abonnement courant ;
 *  - l'expiration des paiements s'appuie sur un `updateMany` filtré par statut,
 *    naturellement sans effet la seconde fois.
 *
 * Un verrou mémoire par tâche évite en outre le chevauchement de deux
 * exécutions lorsqu'un lot est plus long que l'intervalle de déclenchement.
 * Toutes les méthodes sont publiques et appelables manuellement (exposées par
 * le contrôleur d'administration) afin de rejouer une tâche à la demande.
 */
@Injectable()
export class LicencesScheduler {
  private readonly logger = new Logger(LicencesScheduler.name);
  private readonly verrous = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly licences: LicencesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Tâches planifiées ─────────────────────────────────────────────────────

  /** Expire les paiements laissés en attente au-delà du délai configuré. */
  @Cron(CronExpression.EVERY_HOUR, { name: 'licences:expirer-paiements' })
  async expirerPaiementsNonPayes(): Promise<RapportTache> {
    return this.executer('expirerPaiementsNonPayes', async (rapport) => {
      const heures = this.licences.parametres.paiementExpirationHeures;
      const limite = new Date(Date.now() - heures * 60 * 60 * 1000);

      const filtre = {
        statut: { in: [PaiementStatut.EN_ATTENTE, PaiementStatut.EN_COURS] },
        createdAt: { lt: limite },
      };

      rapport.examines = await this.prisma.paiement.count({ where: filtre });
      if (rapport.examines === 0) return;

      // `updateMany` filtré sur le statut : un second passage ne trouve plus
      // rien à faire, la tâche est donc rejouable sans risque.
      const { count } = await this.prisma.paiement.updateMany({
        where: filtre,
        data: { statut: PaiementStatut.EXPIRE },
      });
      rapport.traites = count;

      this.logger.log(`${count} paiement(s) expiré(s) après ${heures} h sans règlement.`);
    });
  }

  /** Bascule en période de grâce les licences dont l'échéance est passée. */
  @Cron(CronExpression.EVERY_DAY_AT_1AM, { name: 'licences:basculer-grace' })
  async basculerLicencesEchues(): Promise<RapportTache> {
    return this.executer('basculerLicencesEchues', async (rapport) => {
      const maintenant = new Date();

      const candidats = await this.prisma.tenant.findMany({
        where: {
          status: { in: [TenantStatus.ACTIVE, TenantStatus.TRIAL] },
          OR: [
            { subscriptionEndsAt: { lt: maintenant } },
            { subscriptionEndsAt: null, trialEndsAt: { lt: maintenant } },
          ],
        },
        select: { id: true },
      });
      rapport.examines = candidats.length;

      for (const { id } of candidats) {
        try {
          // `basculerEnGrace` est lui-même idempotent : il renvoie `false`
          // si la grâce de ce cycle est déjà ouverte.
          if (await this.licences.basculerEnGrace(id)) rapport.traites++;
        } catch (erreur) {
          rapport.erreurs++;
          this.logger.error(`Bascule en grâce impossible pour ${id}`, erreur as Error);
        }
      }
    });
  }

  /** Coupe l'accès des licences dont la période de grâce est écoulée. */
  @Cron(CronExpression.EVERY_DAY_AT_2AM, { name: 'licences:couper-acces' })
  async couperAccesFinDeGrace(): Promise<RapportTache> {
    return this.executer('couperAccesFinDeGrace', async (rapport) => {
      // Le champ `graceJusquA` vit dans le JSON `settings` : on présélectionne
      // largement en base, puis on tranche en mémoire.
      const candidats = await this.prisma.tenant.findMany({
        where: { status: { in: [TenantStatus.ACTIVE, TenantStatus.TRIAL] } },
        select: { id: true, settings: true },
      });

      const maintenant = Date.now();
      const enGrace = candidats.filter(({ settings }) => {
        const meta = this.lireMetaLicence(settings);
        return (
          meta.statut === StatutLicence.GRACE &&
          !!meta.graceJusquA &&
          new Date(meta.graceJusquA).getTime() <= maintenant
        );
      });
      rapport.examines = enGrace.length;

      for (const { id } of enGrace) {
        try {
          if (await this.licences.expirerFinDeGrace(id)) rapport.traites++;
        } catch (erreur) {
          rapport.erreurs++;
          this.logger.error(`Coupure d'accès impossible pour ${id}`, erreur as Error);
        }
      }
    });
  }

  /**
   * Rappels d'expiration aux échéances configurées (J-7, J-3, J-1 par défaut).
   *
   * Le schéma ne prévoit pas de type d'événement « rappel » : la notification
   * est publiée sur le bus d'événements (`licence.rappel-expiration`), à charge
   * du module notifications de s'y abonner. Le verrou d'idempotence est porté
   * par `marquerRappelEnvoye`, qui n'autorise qu'un envoi par couple
   * (cycle d'abonnement, jour de rappel).
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM, { name: 'licences:rappels-expiration' })
  async envoyerRappelsExpiration(): Promise<RapportTache> {
    return this.executer('envoyerRappelsExpiration', async (rapport) => {
      const { rappelsJours } = this.licences.parametres;
      if (rappelsJours.length === 0) return;

      const maintenant = new Date();
      const horizon = new Date(
        maintenant.getTime() + Math.max(...rappelsJours) * MS_PAR_JOUR,
      );

      const candidats = await this.prisma.tenant.findMany({
        where: {
          status: { in: [TenantStatus.ACTIVE, TenantStatus.TRIAL] },
          OR: [
            { subscriptionEndsAt: { gt: maintenant, lte: horizon } },
            { subscriptionEndsAt: null, trialEndsAt: { gt: maintenant, lte: horizon } },
          ],
        },
        select: {
          id: true,
          name: true,
          plan: true,
          subscriptionEndsAt: true,
          trialEndsAt: true,
        },
      });
      rapport.examines = candidats.length;

      for (const tenant of candidats) {
        const echeance = tenant.subscriptionEndsAt ?? tenant.trialEndsAt;
        if (!echeance) continue;

        const joursRestants = Math.ceil(
          (echeance.getTime() - maintenant.getTime()) / MS_PAR_JOUR,
        );
        if (!rappelsJours.includes(joursRestants)) continue;

        try {
          const aEnvoyer = await this.licences.marquerRappelEnvoye(tenant.id, joursRestants);
          if (!aEnvoyer) continue; // déjà notifié pour ce cycle

          this.eventEmitter.emit('licence.rappel-expiration', {
            tenantId: tenant.id,
            nomTenant: tenant.name,
            plan: tenant.plan,
            echeance,
            joursRestants,
          });
          rapport.traites++;
        } catch (erreur) {
          rapport.erreurs++;
          this.logger.error(`Rappel impossible pour ${tenant.id}`, erreur as Error);
        }
      }
    });
  }

  /** Exécute les quatre tâches à la suite ; utile pour un rejeu manuel. */
  async executerToutesLesTaches(): Promise<RapportTache[]> {
    return [
      await this.expirerPaiementsNonPayes(),
      await this.basculerLicencesEchues(),
      await this.couperAccesFinDeGrace(),
      await this.envoyerRappelsExpiration(),
    ];
  }

  // ─── Interne ───────────────────────────────────────────────────────────────

  /** Enveloppe commune : verrou anti-chevauchement, chronométrage, journal. */
  private async executer(
    nom: string,
    corps: (rapport: RapportTache) => Promise<void>,
  ): Promise<RapportTache> {
    const rapport: RapportTache = { tache: nom, examines: 0, traites: 0, erreurs: 0 };

    if (this.verrous.has(nom)) {
      this.logger.warn(`Tâche ${nom} déjà en cours : exécution ignorée.`);
      return rapport;
    }
    this.verrous.add(nom);

    const debut = Date.now();
    try {
      await corps(rapport);
    } catch (erreur) {
      rapport.erreurs++;
      this.logger.error(`Échec de la tâche ${nom}`, erreur as Error);
    } finally {
      this.verrous.delete(nom);
    }

    if (rapport.traites > 0 || rapport.erreurs > 0) {
      this.logger.log(
        `${nom} : ${rapport.traites}/${rapport.examines} traité(s), ` +
          `${rapport.erreurs} erreur(s) en ${Date.now() - debut} ms.`,
      );
    }
    return rapport;
  }

  private lireMetaLicence(settings: unknown): {
    statut?: StatutLicence;
    graceJusquA?: string | null;
  } {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return {};
    const licence = (settings as Record<string, unknown>).licence;
    if (!licence || typeof licence !== 'object' || Array.isArray(licence)) return {};
    return licence as { statut?: StatutLicence; graceJusquA?: string | null };
  }
}
