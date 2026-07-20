import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  LicenceEventType,
  Prisma,
  TenantPlan,
  TenantStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LICENCES_CONFIG_KEY, LicencesConfig } from './licences.config';
import { LICENCE_EVENTS } from './licences.events';
import {
  ActivationDepuisPaiement,
  StatutLicence,
  StatutLicenceResultat,
} from './dto/licences.dto';

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

/**
 * Métadonnées de licence stockées dans `Tenant.settings.licence`.
 *
 * Le schéma Prisma ne comporte que quatre statuts de tenant (ACTIVE,
 * SUSPENDED, TRIAL, EXPIRED) alors que le cycle de vie métier en compte huit.
 * Plutôt que de modifier le schéma, l'état fin est porté par ce sous-objet du
 * champ JSON `settings`, et `TenantStatus` reste la source de vérité pour
 * l'autorisation d'accès (c'est lui que lit le reste de l'application).
 */
interface MetaLicence {
  statut?: StatutLicence;
  /** Fin de la période de grâce (ISO). */
  graceJusquA?: string | null;
  /** Fin d'une licence provisoire accordée manuellement (ISO). */
  provisoireJusquA?: string | null;
  /** Vrai dès qu'un essai a été consommé : un essai n'est jamais rejouable. */
  essaiConsomme?: boolean;
  /** Motif de la dernière transition subie (suspension, révocation…). */
  motif?: string | null;
  /** Statut à restaurer lors d'une réactivation. */
  statutAvantSuspension?: StatutLicence | null;
  /**
   * Rappels d'expiration déjà envoyés, indexés par cycle d'abonnement
   * (clé = date de fin ISO). Renouveler change la clé, ce qui réarme
   * naturellement les rappels du cycle suivant.
   */
  rappelsEnvoyes?: Record<string, number[]>;
}

/** Rang des plans, pour distinguer une montée en gamme d'une rétrogradation. */
const RANG_PLAN: Record<TenantPlan, number> = {
  [TenantPlan.STARTER]: 1,
  [TenantPlan.PROFESSIONAL]: 2,
  [TenantPlan.ENTERPRISE]: 3,
  [TenantPlan.CUSTOM]: 4,
};

/** Statuts pour lesquels l'accès à l'application reste ouvert. */
const STATUTS_ACTIFS: ReadonlySet<StatutLicence> = new Set([
  StatutLicence.ESSAI,
  StatutLicence.PROVISOIRE,
  StatutLicence.ACTIVE,
  StatutLicence.GRACE,
]);

export function ajouterJours(base: Date, jours: number): Date {
  return new Date(base.getTime() + jours * MS_PAR_JOUR);
}

export function ajouterMois(base: Date, mois: number): Date {
  const resultat = new Date(base.getTime());
  const jourInitial = resultat.getDate();
  resultat.setMonth(resultat.getMonth() + mois);
  // Report du 31 sur un mois plus court : on retombe sur le dernier jour utile
  // du mois cible plutôt que de déborder sur le mois suivant.
  if (resultat.getDate() !== jourInitial) {
    resultat.setDate(0);
  }
  return resultat;
}

@Injectable()
export class LicencesService {
  private readonly logger = new Logger(LicencesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Publie un événement de licence sans jamais compromettre la transition qui
   * vient d'être écrite : `emit` est synchrone, une erreur d'abonné remonterait
   * sinon jusqu'au planificateur.
   */
  private publier(evenement: string, charge: Record<string, unknown>): void {
    try {
      this.eventEmitter.emit(evenement, charge);
    } catch (erreur) {
      const message = erreur instanceof Error ? erreur.message : String(erreur);
      this.logger.error(`Publication de l'événement ${evenement} impossible : ${message}`);
    }
  }

  /** Configuration des durées, avec repli sur les valeurs par défaut. */
  get parametres(): LicencesConfig {
    return (
      this.config.get<LicencesConfig>(LICENCES_CONFIG_KEY) ?? {
        essaiJours: 14,
        graceJours: 7,
        provisoireMaxJours: 14,
        paiementExpirationHeures: 48,
        rappelsJours: [7, 3, 1],
      }
    );
  }

  // ─── Lecture ───────────────────────────────────────────────────────────────

  /** Vue consolidée du statut de licence d'un tenant. */
  async getStatutLicence(tenantId: string): Promise<StatutLicenceResultat> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} non trouvé`);
    }
    return this.construireStatut(tenant);
  }

  /** Historique des événements de licence d'un tenant, du plus récent au plus ancien. */
  async getHistorique(tenantId: string, limit = 50, offset = 0) {
    const [events, total] = await Promise.all([
      this.prisma.licenceEvent.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.licenceEvent.count({ where: { tenantId } }),
    ]);
    return { total, limit, offset, events };
  }

  // ─── Transitions ───────────────────────────────────────────────────────────

  /**
   * Ouvre la période d'essai. Un essai est UNIQUE par tenant : la présence
   * d'un événement ESSAI_ACTIVE antérieur (ou du drapeau `essaiConsomme`)
   * suffit à refuser une seconde ouverture, même si l'essai est terminé.
   */
  async activerEssai(
    tenantId: string,
    options: { dureeJours?: number; plan?: TenantPlan; agentId?: string } = {},
  ): Promise<StatutLicenceResultat> {
    const dureeJours = options.dureeJours ?? this.parametres.essaiJours;

    return this.prisma.$transaction(async (tx) => {
      const tenant = await this.chargerTenant(tx, tenantId);
      const meta = this.lireMeta(tenant.settings);

      const essaiAnterieur = await tx.licenceEvent.count({
        where: { tenantId, type: LicenceEventType.ESSAI_ACTIVE },
      });
      if (essaiAnterieur > 0 || meta.essaiConsomme) {
        throw new ConflictException(
          "Cet établissement a déjà consommé sa période d'essai ; elle n'est pas rejouable.",
        );
      }

      const debut = new Date();
      const fin = ajouterJours(debut, dureeJours);
      const plan = options.plan ?? tenant.plan;

      const misAJour = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          status: TenantStatus.TRIAL,
          plan,
          trialEndsAt: fin,
          settings: this.ecrireMeta(tenant.settings, {
            ...meta,
            statut: StatutLicence.ESSAI,
            essaiConsomme: true,
            motif: null,
            graceJusquA: null,
            provisoireJusquA: null,
          }),
        },
      });

      await tx.licenceEvent.create({
        data: {
          tenantId,
          type: LicenceEventType.ESSAI_ACTIVE,
          plan,
          dateDebut: debut,
          dateFin: fin,
          motif: `Essai de ${dureeJours} jours`,
          agentId: options.agentId,
        },
      });

      return this.construireStatut(misAJour);
    });
  }

  /**
   * Active (ou prolonge) un abonnement à la suite d'un paiement validé.
   *
   * Point d'entrée public destiné au module paiements : c'est lui qui dépend
   * des licences, jamais l'inverse.
   */
  async activerDepuisPaiement(
    params: ActivationDepuisPaiement,
  ): Promise<StatutLicenceResultat> {
    return this.etendreAbonnement(params.tenantId, {
      dureeMois: params.dureeMois,
      plan: params.plan,
      montant: params.montant,
      devise: params.devise,
      offreId: params.offreId,
      agentId: params.agentId,
      motif: params.referencePaiement
        ? `Paiement ${params.referencePaiement}`
        : 'Paiement validé',
    });
  }

  /** Alias explicite d'`activerDepuisPaiement`, pour les appels administratifs. */
  async activerAbonnement(
    tenantId: string,
    options: {
      dureeMois: number;
      plan?: TenantPlan;
      montant?: number;
      devise?: string;
      offreId?: string;
      agentId?: string;
      motif?: string;
    },
  ): Promise<StatutLicenceResultat> {
    return this.etendreAbonnement(tenantId, options);
  }

  /**
   * Renouvellement, y compris ANTICIPÉ.
   *
   * Règle critique : la nouvelle échéance part de la date de fin COURANTE
   * lorsque celle-ci est encore dans le futur, jamais d'aujourd'hui. Renouveler
   * cinq jours avant l'échéance ne doit pas faire perdre ces cinq jours au
   * client. Voir `licences.service.spec.ts`.
   */
  async renouveler(
    tenantId: string,
    options: {
      dureeMois: number;
      montant?: number;
      devise?: string;
      referencePaiement?: string;
      agentId?: string;
    },
  ): Promise<StatutLicenceResultat> {
    return this.etendreAbonnement(tenantId, {
      dureeMois: options.dureeMois,
      montant: options.montant,
      devise: options.devise,
      agentId: options.agentId,
      motif: options.referencePaiement
        ? `Renouvellement — paiement ${options.referencePaiement}`
        : 'Renouvellement',
      forcerRenouvellement: true,
    });
  }

  /** Montée en gamme ou rétrogradation du plan, sans toucher à l'échéance. */
  async changerPlan(
    tenantId: string,
    nouveauPlan: TenantPlan,
    options: { motif?: string; montant?: number; devise?: string; agentId?: string } = {},
  ): Promise<StatutLicenceResultat> {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await this.chargerTenant(tx, tenantId);

      if (tenant.plan === nouveauPlan) {
        throw new ConflictException(`L'établissement est déjà sur le plan ${nouveauPlan}.`);
      }

      const type =
        RANG_PLAN[nouveauPlan] > RANG_PLAN[tenant.plan]
          ? LicenceEventType.ABONNEMENT_UPGRAYE
          : LicenceEventType.ABONNEMENT_DEGRADE;

      const misAJour = await tx.tenant.update({
        where: { id: tenantId },
        data: { plan: nouveauPlan },
      });

      await tx.licenceEvent.create({
        data: {
          tenantId,
          type,
          plan: nouveauPlan,
          montant: options.montant,
          devise: options.devise ?? tenant.currency,
          dateDebut: new Date(),
          dateFin: tenant.subscriptionEndsAt,
          motif: options.motif ?? `Passage de ${tenant.plan} à ${nouveauPlan}`,
          agentId: options.agentId,
        },
      });

      return this.construireStatut(misAJour);
    });
  }

  /** Suspend l'accès sans détruire l'échéance : la réactivation la restaure. */
  async suspendre(
    tenantId: string,
    motif: string,
    agentId?: string,
  ): Promise<StatutLicenceResultat> {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await this.chargerTenant(tx, tenantId);
      const meta = this.lireMeta(tenant.settings);
      const statutActuel = this.deduireStatut(tenant, meta);

      if (statutActuel === StatutLicence.SUSPENDUE) {
        throw new ConflictException('Cette licence est déjà suspendue.');
      }
      if (statutActuel === StatutLicence.REVOQUEE) {
        throw new ConflictException('Une licence révoquée ne peut pas être suspendue.');
      }

      const misAJour = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          status: TenantStatus.SUSPENDED,
          settings: this.ecrireMeta(tenant.settings, {
            ...meta,
            statut: StatutLicence.SUSPENDUE,
            statutAvantSuspension: statutActuel,
            motif,
          }),
        },
      });

      await tx.licenceEvent.create({
        data: {
          tenantId,
          type: LicenceEventType.ABONNEMENT_SUSPENDU,
          plan: tenant.plan,
          dateFin: tenant.subscriptionEndsAt,
          motif,
          agentId,
        },
      });

      return this.construireStatut(misAJour);
    });
  }

  /** Lève une suspension et restitue le statut déduit des dates courantes. */
  async reactiver(
    tenantId: string,
    motif: string,
    agentId?: string,
  ): Promise<StatutLicenceResultat> {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await this.chargerTenant(tx, tenantId);
      const meta = this.lireMeta(tenant.settings);

      if (meta.statut === StatutLicence.REVOQUEE) {
        throw new ConflictException(
          "Une licence révoquée ne se réactive pas : ouvrez un nouvel abonnement.",
        );
      }
      if (tenant.status !== TenantStatus.SUSPENDED) {
        throw new ConflictException("Cette licence n'est pas suspendue.");
      }

      // On repart des dates : le statut restauré est celui qui découle
      // réellement du calendrier, pas celui figé avant la suspension.
      const metaRestauree: MetaLicence = {
        ...meta,
        statut: undefined,
        statutAvantSuspension: null,
        motif,
      };
      const statutCible = this.deduireStatut(
        { ...tenant, status: TenantStatus.ACTIVE },
        metaRestauree,
      );

      const misAJour = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          status:
            statutCible === StatutLicence.EXPIREE
              ? TenantStatus.EXPIRED
              : statutCible === StatutLicence.ESSAI
                ? TenantStatus.TRIAL
                : TenantStatus.ACTIVE,
          settings: this.ecrireMeta(tenant.settings, {
            ...metaRestauree,
            statut: statutCible,
          }),
        },
      });

      await tx.licenceEvent.create({
        data: {
          tenantId,
          type: LicenceEventType.ABONNEMENT_REACTIVE,
          plan: tenant.plan,
          dateDebut: new Date(),
          dateFin: tenant.subscriptionEndsAt,
          motif,
          agentId,
        },
      });

      return this.construireStatut(misAJour);
    });
  }

  /**
   * Révocation définitive : l'échéance est effacée et la licence ne peut plus
   * être réactivée. Le schéma ne comporte pas de type d'événement dédié : on
   * journalise un ABONNEMENT_SUSPENDU dont le motif est explicitement préfixé.
   */
  async revoquer(
    tenantId: string,
    motif: string,
    agentId?: string,
  ): Promise<StatutLicenceResultat> {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await this.chargerTenant(tx, tenantId);
      const meta = this.lireMeta(tenant.settings);

      if (meta.statut === StatutLicence.REVOQUEE) {
        throw new ConflictException('Cette licence est déjà révoquée.');
      }

      const misAJour = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          status: TenantStatus.EXPIRED,
          subscriptionEndsAt: null,
          trialEndsAt: null,
          settings: this.ecrireMeta(tenant.settings, {
            ...meta,
            statut: StatutLicence.REVOQUEE,
            graceJusquA: null,
            provisoireJusquA: null,
            statutAvantSuspension: null,
            motif,
          }),
        },
      });

      await tx.licenceEvent.create({
        data: {
          tenantId,
          type: LicenceEventType.ABONNEMENT_SUSPENDU,
          plan: tenant.plan,
          motif: `RÉVOCATION : ${motif}`,
          agentId,
        },
      });

      return this.construireStatut(misAJour);
    });
  }

  /**
   * Licence provisoire accordée manuellement par un administrateur en attendant
   * l'encaissement. Plafonnée par `provisoireMaxJours` (14 jours par défaut) :
   * au-delà, la demande est refusée plutôt que silencieusement tronquée.
   */
  async accorderLicenceProvisoire(
    tenantId: string,
    dureeJours: number,
    motif: string,
    options: { plan?: TenantPlan; agentId?: string } = {},
  ): Promise<StatutLicenceResultat> {
    const plafond = this.parametres.provisoireMaxJours;
    if (dureeJours > plafond) {
      throw new BadRequestException(
        `Une licence provisoire ne peut excéder ${plafond} jours (demande : ${dureeJours}).`,
      );
    }
    if (dureeJours <= 0) {
      throw new BadRequestException('La durée doit être strictement positive.');
    }

    return this.prisma.$transaction(async (tx) => {
      const tenant = await this.chargerTenant(tx, tenantId);
      const meta = this.lireMeta(tenant.settings);

      if (meta.statut === StatutLicence.REVOQUEE) {
        throw new ConflictException(
          'Impossible d’accorder une licence provisoire à une licence révoquée.',
        );
      }

      const debut = new Date();
      const fin = ajouterJours(debut, dureeJours);
      const plan = options.plan ?? tenant.plan;

      const misAJour = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          status: TenantStatus.ACTIVE,
          plan,
          settings: this.ecrireMeta(tenant.settings, {
            ...meta,
            statut: StatutLicence.PROVISOIRE,
            provisoireJusquA: fin.toISOString(),
            motif,
          }),
        },
      });

      await tx.licenceEvent.create({
        data: {
          tenantId,
          type: LicenceEventType.ABONNEMENT_ACTIVE,
          plan,
          dateDebut: debut,
          dateFin: fin,
          motif: `LICENCE PROVISOIRE (${dureeJours} j) : ${motif}`,
          agentId: options.agentId,
        },
      });

      return this.construireStatut(misAJour);
    });
  }

  /**
   * Marque la licence en attente de paiement (offre acceptée, encaissement
   * non confirmé). N'ouvre aucun accès par elle-même.
   */
  async marquerEnAttentePaiement(
    tenantId: string,
    motif = 'En attente de paiement',
  ): Promise<StatutLicenceResultat> {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await this.chargerTenant(tx, tenantId);
      const meta = this.lireMeta(tenant.settings);
      const misAJour = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          settings: this.ecrireMeta(tenant.settings, {
            ...meta,
            statut: StatutLicence.EN_ATTENTE_PAIEMENT,
            motif,
          }),
        },
      });
      return this.construireStatut(misAJour);
    });
  }

  // ─── Transitions utilisées par le planificateur ────────────────────────────

  /**
   * Bascule une licence échue en période de grâce. Idempotent : si une période
   * de grâce est déjà ouverte pour ce cycle, la méthode ne fait rien et
   * renvoie `false` sans journaliser de second événement.
   */
  async basculerEnGrace(tenantId: string): Promise<boolean> {
    const { graceJours } = this.parametres;

    // La transaction renvoie de quoi notifier, ou `null` si rien n'a changé :
    // l'événement n'est publié qu'APRÈS la validation de la transaction.
    const transition = await this.prisma.$transaction(async (tx) => {
      const tenant = await this.chargerTenant(tx, tenantId);
      const meta = this.lireMeta(tenant.settings);
      const maintenant = new Date();

      const echeance = tenant.subscriptionEndsAt ?? tenant.trialEndsAt;
      if (!echeance || echeance > maintenant) return null;
      if (meta.statut === StatutLicence.REVOQUEE || meta.statut === StatutLicence.SUSPENDUE) {
        return null;
      }
      // Déjà traité pour ce cycle : la fin de grâce dérive de cette échéance.
      const finGracePrevue = ajouterJours(echeance, graceJours);
      if (meta.graceJusquA && new Date(meta.graceJusquA).getTime() === finGracePrevue.getTime()) {
        return null;
      }
      if (meta.graceJusquA && new Date(meta.graceJusquA) > maintenant) return null;
      if (meta.statut === StatutLicence.EXPIREE) return null;

      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          status: TenantStatus.ACTIVE,
          settings: this.ecrireMeta(tenant.settings, {
            ...meta,
            statut: StatutLicence.GRACE,
            graceJusquA: finGracePrevue.toISOString(),
          }),
        },
      });

      await tx.licenceEvent.create({
        data: {
          tenantId,
          type: LicenceEventType.PERIODE_GRACE_ACTIVEE,
          plan: tenant.plan,
          dateDebut: echeance,
          dateFin: finGracePrevue,
          periodeGrace: finGracePrevue,
          motif: `Période de grâce de ${graceJours} jours après échéance`,
        },
      });

      return {
        nomTenant: tenant.name,
        plan: tenant.plan as string,
        echeance,
        graceJusquA: finGracePrevue,
      };
    });

    if (!transition) return false;

    this.publier(LICENCE_EVENTS.PERIODE_GRACE, {
      tenantId,
      nomTenant: transition.nomTenant,
      plan: transition.plan,
      echeance: transition.echeance,
      graceJusquA: transition.graceJusquA,
      graceJours,
    });

    return true;
  }

  /**
   * Coupe l'accès à l'issue de la période de grâce. Idempotent : une licence
   * déjà expirée n'est pas retraitée.
   */
  async expirerFinDeGrace(tenantId: string): Promise<boolean> {
    const transition = await this.prisma.$transaction(async (tx) => {
      const tenant = await this.chargerTenant(tx, tenantId);
      const meta = this.lireMeta(tenant.settings);
      const maintenant = new Date();

      if (meta.statut !== StatutLicence.GRACE) return null;
      if (!meta.graceJusquA || new Date(meta.graceJusquA) > maintenant) return null;

      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          status: TenantStatus.EXPIRED,
          settings: this.ecrireMeta(tenant.settings, {
            ...meta,
            statut: StatutLicence.EXPIREE,
            graceJusquA: null,
          }),
        },
      });

      await tx.licenceEvent.create({
        data: {
          tenantId,
          type: LicenceEventType.ABONNEMENT_EXPIRE,
          plan: tenant.plan,
          dateFin: tenant.subscriptionEndsAt,
          motif: 'Fin de période de grâce : accès suspendu',
        },
      });

      return {
        nomTenant: tenant.name,
        plan: tenant.plan as string,
        expireeAt: maintenant,
      };
    });

    if (!transition) return false;

    this.publier(LICENCE_EVENTS.EXPIREE, {
      tenantId,
      nomTenant: transition.nomTenant,
      plan: transition.plan,
      expireeAt: transition.expireeAt,
    });

    return true;
  }

  /**
   * Enregistre l'envoi d'un rappel J-N. Renvoie `false` si ce rappel a déjà
   * été émis pour le cycle courant — c'est le verrou d'idempotence des rappels.
   */
  async marquerRappelEnvoye(tenantId: string, joursAvant: number): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await this.chargerTenant(tx, tenantId);
      const meta = this.lireMeta(tenant.settings);
      const echeance = tenant.subscriptionEndsAt ?? tenant.trialEndsAt;
      if (!echeance) return false;

      const cle = new Date(echeance).toISOString();
      const rappels = { ...(meta.rappelsEnvoyes ?? {}) };
      const dejaEnvoyes = rappels[cle] ?? [];
      if (dejaEnvoyes.includes(joursAvant)) return false;

      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          settings: this.ecrireMeta(tenant.settings, {
            ...meta,
            // Un seul cycle conservé : inutile d'accumuler l'historique ici,
            // les événements de licence font foi.
            rappelsEnvoyes: { [cle]: [...dejaEnvoyes, joursAvant] },
          }),
        },
      });

      return true;
    });
  }

  // ─── Interne ───────────────────────────────────────────────────────────────

  /**
   * Cœur de l'activation et du renouvellement.
   *
   * La base de calcul est `max(échéance courante, maintenant)` : tant que
   * l'abonnement court, on repart de sa fin, ce qui préserve les jours restants
   * lors d'un renouvellement anticipé. Une fois l'échéance passée, on repart
   * d'aujourd'hui pour ne pas facturer une période déjà écoulée.
   */
  private async etendreAbonnement(
    tenantId: string,
    options: {
      dureeMois: number;
      plan?: TenantPlan;
      montant?: number;
      devise?: string;
      offreId?: string;
      agentId?: string;
      motif?: string;
      forcerRenouvellement?: boolean;
    },
  ): Promise<StatutLicenceResultat> {
    if (!Number.isInteger(options.dureeMois) || options.dureeMois <= 0) {
      throw new BadRequestException('La durée doit être un nombre de mois entier positif.');
    }

    return this.prisma.$transaction(async (tx) => {
      const tenant = await this.chargerTenant(tx, tenantId);
      const meta = this.lireMeta(tenant.settings);

      if (meta.statut === StatutLicence.REVOQUEE) {
        throw new ConflictException(
          'Licence révoquée : levez la révocation avant toute activation.',
        );
      }

      const maintenant = new Date();
      const echeanceCourante = tenant.subscriptionEndsAt;
      const abonnementEnCours = !!echeanceCourante && echeanceCourante > maintenant;

      // ── Point critique : renouvellement anticipé ──
      const base = abonnementEnCours ? echeanceCourante : maintenant;
      const nouvelleFin = ajouterMois(base, options.dureeMois);

      const type =
        options.forcerRenouvellement || abonnementEnCours
          ? LicenceEventType.ABONNEMENT_RENOUVELE
          : LicenceEventType.ABONNEMENT_ACTIVE;

      const plan = options.plan ?? tenant.plan;

      const misAJour = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          status: TenantStatus.ACTIVE,
          plan,
          subscriptionEndsAt: nouvelleFin,
          settings: this.ecrireMeta(tenant.settings, {
            ...meta,
            statut: StatutLicence.ACTIVE,
            // Un encaissement solde la grâce et la licence provisoire.
            graceJusquA: null,
            provisoireJusquA: null,
            statutAvantSuspension: null,
            motif: options.motif ?? null,
            // Nouveau cycle : les rappels du cycle précédent sont périmés.
            rappelsEnvoyes: {},
          }),
        },
      });

      await tx.licenceEvent.create({
        data: {
          tenantId,
          offreId: options.offreId,
          type,
          plan,
          montant: options.montant,
          devise: options.devise ?? tenant.currency,
          dateDebut: base,
          dateFin: nouvelleFin,
          motif: options.motif,
          agentId: options.agentId,
        },
      });

      return this.construireStatut(misAJour);
    });
  }

  private async chargerTenant(tx: Prisma.TransactionClient, tenantId: string) {
    const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} non trouvé`);
    }
    return tenant;
  }

  /** Extrait le sous-objet `licence` de `Tenant.settings`, tolérant au bruit. */
  private lireMeta(settings: unknown): MetaLicence {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return {};
    const licence = (settings as Record<string, unknown>).licence;
    if (!licence || typeof licence !== 'object' || Array.isArray(licence)) return {};
    return licence as MetaLicence;
  }

  /** Réécrit `settings` en ne remplaçant que la clé `licence`. */
  private ecrireMeta(settings: unknown, meta: MetaLicence): Prisma.InputJsonValue {
    const base =
      settings && typeof settings === 'object' && !Array.isArray(settings)
        ? { ...(settings as Record<string, unknown>) }
        : {};
    base.licence = JSON.parse(JSON.stringify(meta));
    return base as Prisma.InputJsonValue;
  }

  /**
   * Déduit le statut métier des dates et du statut Prisma. Les dates priment
   * sur la valeur mémorisée : une donnée figée ne doit jamais prolonger un
   * accès que le calendrier a fermé.
   */
  private deduireStatut(
    tenant: {
      status: TenantStatus;
      trialEndsAt: Date | null;
      subscriptionEndsAt: Date | null;
    },
    meta: MetaLicence,
  ): StatutLicence {
    const maintenant = new Date();

    if (meta.statut === StatutLicence.REVOQUEE) return StatutLicence.REVOQUEE;
    if (tenant.status === TenantStatus.SUSPENDED) return StatutLicence.SUSPENDUE;

    if (meta.provisoireJusquA && new Date(meta.provisoireJusquA) > maintenant) {
      return StatutLicence.PROVISOIRE;
    }
    if (tenant.subscriptionEndsAt && tenant.subscriptionEndsAt > maintenant) {
      return StatutLicence.ACTIVE;
    }
    if (tenant.trialEndsAt && tenant.trialEndsAt > maintenant && !tenant.subscriptionEndsAt) {
      return StatutLicence.ESSAI;
    }
    if (meta.graceJusquA && new Date(meta.graceJusquA) > maintenant) {
      return StatutLicence.GRACE;
    }
    if (meta.statut === StatutLicence.EN_ATTENTE_PAIEMENT && !tenant.subscriptionEndsAt) {
      return StatutLicence.EN_ATTENTE_PAIEMENT;
    }
    return StatutLicence.EXPIREE;
  }

  private construireStatut(tenant: {
    id: string;
    plan: TenantPlan;
    status: TenantStatus;
    currency?: string;
    trialEndsAt: Date | null;
    subscriptionEndsAt: Date | null;
    settings: unknown;
  }): StatutLicenceResultat {
    const meta = this.lireMeta(tenant.settings);
    const statut = this.deduireStatut(tenant, meta);
    const maintenant = new Date();

    const echeance =
      statut === StatutLicence.PROVISOIRE && meta.provisoireJusquA
        ? new Date(meta.provisoireJusquA)
        : statut === StatutLicence.GRACE && meta.graceJusquA
          ? new Date(meta.graceJusquA)
          : statut === StatutLicence.ESSAI
            ? tenant.trialEndsAt
            : tenant.subscriptionEndsAt;

    return {
      tenantId: tenant.id,
      statut,
      plan: tenant.plan,
      actif: STATUTS_ACTIFS.has(statut),
      trialEndsAt: tenant.trialEndsAt ?? null,
      subscriptionEndsAt: tenant.subscriptionEndsAt ?? null,
      graceJusquA: meta.graceJusquA ? new Date(meta.graceJusquA) : null,
      provisoireJusquA: meta.provisoireJusquA ? new Date(meta.provisoireJusquA) : null,
      joursRestants: echeance
        ? Math.max(0, Math.ceil((echeance.getTime() - maintenant.getTime()) / MS_PAR_JOUR))
        : null,
      essaiConsomme: !!meta.essaiConsomme,
      motif: meta.motif ?? null,
    };
  }
}
