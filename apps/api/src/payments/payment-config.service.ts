import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod, PaymentMethodConfig, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePaymentConfigDto,
  UpdatePaymentConfigDto,
} from './dto/payment-config.dto';

/** Algorithme de chiffrement au repos des secrets de passerelle. */
const ALGORITHME = 'aes-256-gcm';
/** Longueur de l'IV en octets, tiré aléatoirement pour CHAQUE valeur. */
const LONGUEUR_IV = 12;
/** Longueur du tag d'authentification GCM. */
const LONGUEUR_TAG = 16;
/** Marqueur des valeurs déjà chiffrées, pour ne pas rechiffrer deux fois. */
const PREFIXE_CHIFFRE = 'enc:v1:';
/** Valeur écrite dans l'audit à la place d'un secret : jamais la valeur réelle. */
export const MASQUE_SECRET = '***';

/** Vue « sûre » d'une configuration : le champ `secrets` est absent. */
export interface IConfigPublique {
  id: string;
  tenantId: string | null;
  methode: PaymentMethod;
  variante: string;
  libelle: string;
  actif: boolean;
  sandbox: boolean;
  parametres: Record<string, any>;
  paysAutorises: string[];
  plansAutorises: string[];
  devises: string[];
  ordreAffichage: number;
  /** Noms des secrets renseignés — jamais leurs valeurs. */
  secretsRenseignes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/** Vue renvoyée au client : uniquement de quoi payer, rien de sensible. */
export interface IMethodeDisponible {
  id: string;
  methode: PaymentMethod;
  variante: string;
  libelle: string;
  sandbox: boolean;
  parametres: Record<string, any>;
  devises: string[];
  ordreAffichage: number;
}

/** Contexte d'écriture pour l'audit : qui agit et depuis quelle IP. */
export interface IContexteAudit {
  userId?: string;
  ipAddress?: string;
}

@Injectable()
export class PaymentConfigService {
  private readonly logger = new Logger(PaymentConfigService.name);
  /** Clé de chiffrement dérivée une fois au démarrage. */
  private readonly cleChiffrement: Buffer;
  /** Vrai si la clé provient d'un repli, donc non fiable en production. */
  private readonly cleParDefaut: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const cleBrute = this.configService.get<string>('PAYMENT_SECRETS_KEY');

    if (!cleBrute) {
      // Repli EXPLICITE : le service continue de fonctionner (dev, tests,
      // premier démarrage) mais on hurle dans les journaux, car les secrets
      // chiffrés avec cette clé de repli sont déchiffrables par quiconque lit
      // le code source. En production, PAYMENT_SECRETS_KEY est obligatoire.
      this.logger.error(
        'PAYMENT_SECRETS_KEY est absente de la configuration : repli sur une ' +
          'clé dérivée en dur. Les secrets de paiement ne sont PAS protégés. ' +
          'Définissez PAYMENT_SECRETS_KEY (32 octets, hex ou base64) avant ' +
          'toute mise en production.',
      );
      this.cleParDefaut = true;
      this.cleChiffrement = crypto
        .createHash('sha256')
        .update('gestmoney-payment-secrets-fallback-key')
        .digest();
    } else {
      this.cleParDefaut = false;
      this.cleChiffrement = this.deriverCle(cleBrute);
    }
  }

  // ─── Chiffrement au repos ───────────────────────────────────────────────────

  /**
   * Accepte une clé en hex (64 caractères), en base64 (44 caractères) ou une
   * phrase secrète quelconque ; dans tous les cas on obtient 32 octets.
   */
  private deriverCle(cleBrute: string): Buffer {
    if (/^[0-9a-fA-F]{64}$/.test(cleBrute)) {
      return Buffer.from(cleBrute, 'hex');
    }
    const base64 = Buffer.from(cleBrute, 'base64');
    if (base64.length === 32) {
      return base64;
    }
    // Phrase secrète : on la condense en 32 octets.
    return crypto.createHash('sha256').update(cleBrute, 'utf8').digest();
  }

  /**
   * Chiffre une valeur en AES-256-GCM.
   * Format produit : `enc:v1:<base64(iv | tag | chiffré)>`.
   * L'IV est tiré au hasard pour CHAQUE appel : deux chiffrements de la même
   * valeur ne produisent jamais le même résultat.
   */
  chiffrer(valeurClaire: string): string {
    if (valeurClaire === null || valeurClaire === undefined) {
      return valeurClaire as any;
    }
    const iv = crypto.randomBytes(LONGUEUR_IV);
    const chiffreur = crypto.createCipheriv(ALGORITHME, this.cleChiffrement, iv);
    const chiffre = Buffer.concat([
      chiffreur.update(String(valeurClaire), 'utf8'),
      chiffreur.final(),
    ]);
    const tag = chiffreur.getAuthTag();
    return PREFIXE_CHIFFRE + Buffer.concat([iv, tag, chiffre]).toString('base64');
  }

  /**
   * Déchiffre une valeur produite par `chiffrer()`. Une valeur non préfixée est
   * renvoyée telle quelle (données historiques écrites avant le chiffrement).
   * Le tag GCM garantit l'intégrité : une donnée altérée en base lève.
   */
  dechiffrer(valeurStockee: string): string {
    if (typeof valeurStockee !== 'string' || !valeurStockee.startsWith(PREFIXE_CHIFFRE)) {
      return valeurStockee;
    }
    try {
      const donnees = Buffer.from(valeurStockee.slice(PREFIXE_CHIFFRE.length), 'base64');
      const iv = donnees.subarray(0, LONGUEUR_IV);
      const tag = donnees.subarray(LONGUEUR_IV, LONGUEUR_IV + LONGUEUR_TAG);
      const chiffre = donnees.subarray(LONGUEUR_IV + LONGUEUR_TAG);
      const dechiffreur = crypto.createDecipheriv(ALGORITHME, this.cleChiffrement, iv);
      dechiffreur.setAuthTag(tag);
      return Buffer.concat([dechiffreur.update(chiffre), dechiffreur.final()]).toString('utf8');
    } catch {
      // On ne remonte JAMAIS le contenu ni la clé dans le message d'erreur.
      this.logger.error(
        'Échec de déchiffrement d\'un secret de paiement : clé changée, ' +
          'donnée altérée, ou secret chiffré avec une autre PAYMENT_SECRETS_KEY.',
      );
      throw new BadRequestException(
        'Secret de paiement illisible — vérifiez PAYMENT_SECRETS_KEY.',
      );
    }
  }

  /** Chiffre chaque valeur d'un objet de secrets, sans toucher aux clés. */
  private chiffrerSecrets(secrets: Record<string, any>): Record<string, string> {
    const sortie: Record<string, string> = {};
    for (const [nom, valeur] of Object.entries(secrets ?? {})) {
      if (valeur === null || valeur === undefined || valeur === '') continue;
      sortie[nom] =
        typeof valeur === 'string' && valeur.startsWith(PREFIXE_CHIFFRE)
          ? valeur
          : this.chiffrer(typeof valeur === 'string' ? valeur : JSON.stringify(valeur));
    }
    return sortie;
  }

  // ─── Projection sûre ────────────────────────────────────────────────────────

  /**
   * Retire `secrets` d'une configuration avant tout renvoi HTTP. Seuls les NOMS
   * des secrets renseignés sont exposés, pour que l'administration puisse
   * afficher « clé API : renseignée » sans jamais divulguer la valeur.
   */
  private versVuePublique(config: PaymentMethodConfig): IConfigPublique {
    const { secrets, ...reste } = config;
    return {
      ...reste,
      parametres: (config.parametres ?? {}) as Record<string, any>,
      secretsRenseignes: Object.keys((secrets ?? {}) as Record<string, any>),
    };
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────

  async creer(
    dto: CreatePaymentConfigDto,
    contexte: IContexteAudit = {},
  ): Promise<IConfigPublique> {
    const variante = dto.variante ?? '';

    const existante = await this.prisma.paymentMethodConfig.findFirst({
      where: { tenantId: dto.tenantId ?? null, methode: dto.methode, variante },
    });
    if (existante) {
      throw new BadRequestException(
        `Une configuration ${dto.methode}${variante ? '/' + variante : ''} existe déjà pour ce périmètre.`,
      );
    }

    const config = await this.prisma.paymentMethodConfig.create({
      data: {
        tenantId: dto.tenantId ?? null,
        methode: dto.methode,
        variante,
        libelle: dto.libelle,
        actif: dto.actif ?? false,
        sandbox: dto.sandbox ?? true,
        parametres: (dto.parametres ?? {}) as Prisma.InputJsonValue,
        secrets: this.chiffrerSecrets(dto.secrets ?? {}) as Prisma.InputJsonValue,
        paysAutorises: dto.paysAutorises ?? [],
        plansAutorises: dto.plansAutorises ?? [],
        devises: dto.devises ?? [],
        ordreAffichage: dto.ordreAffichage ?? 0,
      },
    });

    await this.journaliser(config.id, 'creation', null, config.libelle, contexte);
    if (dto.secrets && Object.keys(dto.secrets).length > 0) {
      // Les noms des secrets sont journalisés, jamais leurs valeurs.
      for (const nom of Object.keys(dto.secrets)) {
        await this.journaliser(config.id, `secrets.${nom}`, null, MASQUE_SECRET, contexte);
      }
    }

    return this.versVuePublique(config);
  }

  async listerToutes(tenantId?: string): Promise<IConfigPublique[]> {
    const configs = await this.prisma.paymentMethodConfig.findMany({
      where: tenantId ? { OR: [{ tenantId }, { tenantId: null }] } : {},
      orderBy: [{ ordreAffichage: 'asc' }, { libelle: 'asc' }],
    });
    return configs.map((c) => this.versVuePublique(c));
  }

  async trouverUne(id: string): Promise<IConfigPublique> {
    const config = await this.prisma.paymentMethodConfig.findUnique({ where: { id } });
    if (!config) {
      throw new NotFoundException('Configuration de paiement introuvable');
    }
    return this.versVuePublique(config);
  }

  async mettreAJour(
    id: string,
    dto: UpdatePaymentConfigDto,
    contexte: IContexteAudit = {},
  ): Promise<IConfigPublique> {
    const avant = await this.prisma.paymentMethodConfig.findUnique({ where: { id } });
    if (!avant) {
      throw new NotFoundException('Configuration de paiement introuvable');
    }

    const donnees: Prisma.PaymentMethodConfigUpdateInput = {};
    const champsSimples: Array<keyof UpdatePaymentConfigDto> = [
      'libelle',
      'actif',
      'sandbox',
      'variante',
      'paysAutorises',
      'plansAutorises',
      'devises',
      'ordreAffichage',
      'parametres',
    ];

    for (const champ of champsSimples) {
      if (dto[champ] === undefined) continue;
      (donnees as any)[champ] = dto[champ];
      await this.journaliser(
        id,
        champ,
        this.enTexte((avant as any)[champ]),
        this.enTexte(dto[champ]),
        contexte,
      );
    }

    if (dto.secrets !== undefined) {
      // Fusion : on n'efface pas les secrets non renvoyés par le formulaire.
      const ancien = (avant.secrets ?? {}) as Record<string, any>;
      const nouveaux = this.chiffrerSecrets(dto.secrets);
      donnees.secrets = { ...ancien, ...nouveaux } as Prisma.InputJsonValue;

      for (const nom of Object.keys(dto.secrets)) {
        // On n'écrit JAMAIS la valeur claire d'un secret dans l'audit : ni
        // l'ancienne, ni la nouvelle. Seul le fait qu'il a changé est tracé.
        await this.journaliser(
          id,
          `secrets.${nom}`,
          nom in ancien ? MASQUE_SECRET : null,
          MASQUE_SECRET,
          contexte,
        );
      }
    }

    const apres = await this.prisma.paymentMethodConfig.update({ where: { id }, data: donnees });
    return this.versVuePublique(apres);
  }

  async basculerActivation(
    id: string,
    actif: boolean,
    contexte: IContexteAudit = {},
  ): Promise<IConfigPublique> {
    const avant = await this.prisma.paymentMethodConfig.findUnique({ where: { id } });
    if (!avant) {
      throw new NotFoundException('Configuration de paiement introuvable');
    }
    const apres = await this.prisma.paymentMethodConfig.update({
      where: { id },
      data: { actif },
    });
    await this.journaliser(id, 'actif', String(avant.actif), String(actif), contexte);
    return this.versVuePublique(apres);
  }

  async supprimer(id: string, contexte: IContexteAudit = {}): Promise<{ supprime: boolean }> {
    const config = await this.prisma.paymentMethodConfig.findUnique({ where: { id } });
    if (!config) {
      throw new NotFoundException('Configuration de paiement introuvable');
    }
    await this.journaliser(id, 'suppression', config.libelle, null, contexte);
    await this.prisma.paymentMethodConfig.delete({ where: { id } });
    return { supprime: true };
  }

  // ─── Exposition client ──────────────────────────────────────────────────────

  /**
   * Méthodes proposables à un client donné.
   *
   * Ne renvoie QUE des méthodes `actif: true` et compatibles avec les filtres,
   * et UNIQUEMENT le champ `parametres` (données non sensibles). Le champ
   * `secrets` n'est jamais lu ici — la projection Prisma ne le sélectionne même
   * pas, de sorte qu'aucun oubli de masquage plus haut ne peut le laisser fuir.
   *
   * Un tableau de restriction vide signifie « aucune restriction ».
   */
  async getMethodesDisponibles(
    tenantId?: string,
    pays?: string,
    plan?: string,
    devise?: string,
  ): Promise<IMethodeDisponible[]> {
    const configs = await this.prisma.paymentMethodConfig.findMany({
      where: {
        actif: true,
        ...(tenantId ? { OR: [{ tenantId }, { tenantId: null }] } : { tenantId: null }),
      },
      // Sélection explicite : `secrets` est structurellement exclu.
      select: {
        id: true,
        methode: true,
        variante: true,
        libelle: true,
        sandbox: true,
        parametres: true,
        paysAutorises: true,
        plansAutorises: true,
        devises: true,
        ordreAffichage: true,
      },
      orderBy: [{ ordreAffichage: 'asc' }, { libelle: 'asc' }],
    });

    /**
     * Un moyen est compatible si :
     *  - il ne porte aucune restriction sur ce critère, OU
     *  - l'appelant n'a pas précisé de valeur (ne rien demander ne doit pas
     *    tout exclure — sinon un moyen restreint à XOF disparaissait dès que
     *    la devise n'était pas passée en paramètre, c'est-à-dire toujours), OU
     *  - la valeur demandée figure dans les restrictions.
     */
    const compatible = (restrictions: string[], valeur?: string) =>
      restrictions.length === 0 || valeur === undefined || restrictions.includes(valeur);

    return configs
      .filter(
        (c) =>
          compatible(c.paysAutorises, pays) &&
          compatible(c.plansAutorises, plan) &&
          compatible(c.devises, devise),
      )
      .map((c) => ({
        id: c.id,
        methode: c.methode,
        variante: c.variante,
        libelle: c.libelle,
        sandbox: c.sandbox,
        parametres: (c.parametres ?? {}) as Record<string, any>,
        devises: c.devises,
        ordreAffichage: c.ordreAffichage,
      }));
  }

  /**
   * Secrets déchiffrés d'une configuration.
   *
   * USAGE INTERNE SERVEUR UNIQUEMENT — aucun contrôleur ne doit exposer cette
   * méthode, directement ou indirectement. Seuls WebhookService (vérification
   * HMAC) et l'appel aux passerelles doivent l'utiliser.
   */
  async getSecrets(configId: string): Promise<Record<string, string>> {
    const config = await this.prisma.paymentMethodConfig.findUnique({
      where: { id: configId },
      select: { secrets: true },
    });
    if (!config) {
      throw new NotFoundException('Configuration de paiement introuvable');
    }
    const sortie: Record<string, string> = {};
    for (const [nom, valeur] of Object.entries((config.secrets ?? {}) as Record<string, any>)) {
      sortie[nom] = this.dechiffrer(String(valeur));
    }
    return sortie;
  }

  /**
   * Secret de webhook du fournisseur indiqué. Sert à WebhookService, qui ne
   * connaît que le nom du provider et pas l'identifiant de configuration.
   */
  async getWebhookSecret(provider: string): Promise<string | null> {
    const configs = await this.prisma.paymentMethodConfig.findMany({
      where: { actif: true },
      select: { id: true, variante: true, parametres: true, secrets: true },
    });

    const cible = configs.find((c) => {
      const params = (c.parametres ?? {}) as Record<string, any>;
      const nomProvider = String(params.provider ?? c.variante ?? '').toUpperCase();
      return nomProvider === provider.toUpperCase();
    });
    if (!cible) return null;

    const secrets = (cible.secrets ?? {}) as Record<string, any>;
    const brut = secrets.webhook_secret ?? secrets.webhookSecret ?? secrets.secret;
    return brut ? this.dechiffrer(String(brut)) : null;
  }

  // ─── Audit ──────────────────────────────────────────────────────────────────

  /** Écrit une ligne d'audit. Les valeurs de secrets arrivent ici déjà masquées. */
  private async journaliser(
    configId: string,
    champ: string,
    ancienneValeur: string | null,
    nouvelleValeur: string | null,
    contexte: IContexteAudit,
  ): Promise<void> {
    try {
      await this.prisma.paymentConfigAudit.create({
        data: {
          configId,
          userId: contexte.userId ?? null,
          champ,
          ancienneValeur,
          nouvelleValeur,
          ipAddress: contexte.ipAddress ?? null,
        },
      });
    } catch (erreur) {
      // L'audit ne doit jamais faire échouer l'opération métier, mais son
      // échec doit être visible.
      this.logger.error(
        `Impossible d'écrire l'audit de configuration ${configId} (${champ})`,
        erreur instanceof Error ? erreur.stack : undefined,
      );
    }
  }

  private enTexte(valeur: any): string | null {
    if (valeur === null || valeur === undefined) return null;
    if (typeof valeur === 'string') return valeur;
    return JSON.stringify(valeur);
  }

  /** Journal d'audit d'une configuration (ou de toutes si `configId` est absent). */
  async getJournalAudit(configId?: string, limite = 100) {
    return this.prisma.paymentConfigAudit.findMany({
      where: configId ? { configId } : {},
      orderBy: { createdAt: 'desc' },
      take: Math.min(limite, 500),
    });
  }

  /** Indique si le service tourne sur la clé de repli (diagnostic admin). */
  utiliseCleParDefaut(): boolean {
    return this.cleParDefaut;
  }
}
