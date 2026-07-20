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
  Paiement,
  PaiementStatut,
  PaymentProvider,
  Prisma,
  ProofStatut,
} from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaiementDto, ListPaiementsQueryDto } from './dto/create-paiement.dto';
import { UploadProofDto } from './dto/payment-proof.dto';
import { IContexteAudit } from './payment-config.service';
import { PAYMENT_EVENTS } from './payments.events';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IPaiement {
  id: string;
  tenantId: string | null;
  reference: string;
  /** Decimal Prisma converti en nombre. */
  montant: number;
  devise: string;
  provider: PaymentProvider;
  providerRef: string | null;
  statut: PaiementStatut;
  metadata: Record<string, any>;
  validePar: string | null;
  valideAt: Date | null;
  rembourseAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPreuve {
  id: string;
  paiementId: string;
  nomOriginal: string | null;
  mimeType: string | null;
  tailleOctets: number | null;
  hashSha256: string | null;
  referenceTexte: string | null;
  statut: ProofStatut;
  motifRejet: string | null;
  revuPar: string | null;
  revuAt: Date | null;
  createdAt: Date;
}

// ─── Règles de filtrage des fichiers téléversés ───────────────────────────────

/**
 * Extensions refusées d'office : tout ce qui peut être interprété ou exécuté
 * par un serveur web, un navigateur ou le système. `.svg` en fait partie car
 * un SVG est un document XML pouvant embarquer du JavaScript.
 */
const EXTENSIONS_INTERDITES = new Set([
  '.php', '.php3', '.php4', '.php5', '.phtml', '.phar',
  '.exe', '.dll', '.com', '.scr', '.msi',
  '.js', '.mjs', '.cjs', '.jsx', '.ts',
  '.sh', '.bash', '.zsh', '.ksh',
  '.bat', '.cmd', '.ps1', '.vbs', '.wsf',
  '.html', '.htm', '.xhtml', '.shtml',
  '.svg', '.svgz', '.xml',
  '.jar', '.py', '.rb', '.pl', '.cgi', '.asp', '.aspx', '.jsp',
  '.htaccess',
]);

/**
 * Liste BLANCHE de mimetypes. Tout ce qui n'est pas explicitement une image
 * bitmap ou un PDF est refusé — c'est la règle la plus forte : elle ne dépend
 * pas de l'exhaustivité de la liste noire d'extensions.
 */
const MIMETYPES_AUTORISES = new Set([
  'image/jpeg',
  'image/pjpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

/** Extensions cohérentes avec la liste blanche de mimetypes. */
const EXTENSIONS_AUTORISEES = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.pdf',
]);

/** Taille maximale d'une preuve : 10 Mo. */
const TAILLE_MAX_OCTETS = 10 * 1024 * 1024;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  /**
   * Racine du stockage privé des preuves. Configurable par
   * PAYMENT_PROOFS_DIR ; par défaut `storage/payment-proofs` à la racine du
   * processus. Ce dossier ne doit JAMAIS être servi en statique : il n'est
   * exposé que par la route admin de téléchargement, derrière un garde.
   */
  private readonly dossierPreuves: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.dossierPreuves = path.resolve(
      this.configService.get<string>('PAYMENT_PROOFS_DIR') ??
        path.join(process.cwd(), 'storage', 'payment-proofs'),
    );
  }

  // ─── Conversions ────────────────────────────────────────────────────────────

  private versIPaiement(p: Paiement): IPaiement {
    return {
      id: p.id,
      tenantId: p.tenantId,
      reference: p.reference,
      montant: Number(p.montant),
      devise: p.devise,
      provider: p.provider,
      providerRef: p.providerRef,
      statut: p.statut,
      metadata: (p.metadata ?? {}) as Record<string, any>,
      validePar: p.validePar,
      valideAt: p.valideAt,
      rembourseAt: p.rembourseAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  /** Vue d'une preuve SANS le chemin de stockage : celui-ci ne sort jamais. */
  private versIPreuve(preuve: any): IPreuve {
    const { cheminFichier, ...reste } = preuve;
    return reste as IPreuve;
  }

  // ─── Publication d'événements ───────────────────────────────────────────────

  /**
   * Publie un événement sur le bus SANS jamais pouvoir faire échouer
   * l'opération métier appelante : `EventEmitter2.emit` est synchrone, une
   * erreur d'abonné remonterait donc dans la pile du paiement. On l'absorbe
   * ici, en plus de la protection déjà présente côté abonnés.
   */
  private publier(evenement: string, charge: Record<string, unknown>): void {
    try {
      this.eventEmitter.emit(evenement, charge);
    } catch (erreur) {
      const message = erreur instanceof Error ? erreur.message : String(erreur);
      this.logger.error(`Publication de l'événement ${evenement} impossible : ${message}`);
    }
  }

  // ─── Création et suivi ──────────────────────────────────────────────────────

  /**
   * Génère une référence unique et NON DEVINABLE.
   *
   * Un compteur incrémental ou un horodatage permettrait à un client d'énumérer
   * les paiements des autres ; on tire donc 12 octets aléatoires
   * cryptographiques, ce qui rend la collision et la devinette impossibles en
   * pratique.
   */
  private genererReference(): string {
    const aleatoire = crypto.randomBytes(12).toString('base64url').toUpperCase();
    return `PAY-${aleatoire}`;
  }

  /**
   * Crée un paiement en attente.
   *
   * Le montant ATTENDU est figé dans `metadata.montantAttendu` au moment de la
   * création : c'est la valeur de référence contre laquelle le webhook
   * comparera le montant réellement encaissé. Rien ne peut la modifier ensuite
   * côté client.
   */
  async creerPaiement(
    dto: CreatePaiementDto,
    tenantId?: string,
    userId?: string,
  ): Promise<IPaiement> {
    const devise = (dto.devise ?? 'XOF').toUpperCase();

    // Boucle de sécurité : la contrainte @unique reste l'arbitre final.
    for (let tentative = 0; tentative < 5; tentative++) {
      const reference = this.genererReference();
      try {
        const paiement = await this.prisma.paiement.create({
          data: {
            tenantId: tenantId ?? null,
            reference,
            montant: new Prisma.Decimal(dto.montant),
            devise,
            provider: dto.provider,
            statut: PaiementStatut.EN_ATTENTE,
            metadata: {
              ...(dto.metadata ?? {}),
              // Montant attendu : source de vérité pour le rapprochement.
              montantAttendu: dto.montant,
              deviseAttendue: devise,
              configId: dto.configId ?? null,
              plan: dto.plan ?? null,
              creePar: userId ?? null,
              creeLe: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        });

        const vue = this.versIPaiement(paiement);
        // Accusé de réception au client, avec la référence et les instructions.
        this.publier(PAYMENT_EVENTS.CREE, {
          paiementId: vue.id,
          tenantId: vue.tenantId,
          reference: vue.reference,
          montant: vue.montant,
          devise: vue.devise,
          provider: vue.provider,
          userId: userId ?? null,
          plan: dto.plan ?? null,
        });
        return vue;
      } catch (erreur) {
        if (
          erreur instanceof Prisma.PrismaClientKnownRequestError &&
          erreur.code === 'P2002'
        ) {
          continue; // collision de référence : on retire.
        }
        throw erreur;
      }
    }
    throw new ConflictException('Impossible de générer une référence de paiement unique');
  }

  async trouverParId(id: string, tenantId?: string): Promise<IPaiement> {
    const paiement = await this.prisma.paiement.findUnique({ where: { id } });
    if (!paiement || (tenantId && paiement.tenantId && paiement.tenantId !== tenantId)) {
      throw new NotFoundException('Paiement introuvable');
    }
    return this.versIPaiement(paiement);
  }

  async trouverParReference(reference: string): Promise<IPaiement | null> {
    const paiement = await this.prisma.paiement.findUnique({ where: { reference } });
    return paiement ? this.versIPaiement(paiement) : null;
  }

  async lister(query: ListPaiementsQueryDto, tenantId?: string): Promise<IPaiement[]> {
    const paiements = await this.prisma.paiement.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(query.statut ? { statut: query.statut } : {}),
        ...(query.provider ? { provider: query.provider } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return paiements.map((p) => this.versIPaiement(p));
  }

  // ─── Preuves de paiement ────────────────────────────────────────────────────

  /** Refuse tout fichier interprétable ou hors liste blanche. */
  private validerFichier(fichier: Express.Multer.File): void {
    if (!fichier || !fichier.buffer || fichier.buffer.length === 0) {
      throw new BadRequestException('Aucun fichier reçu');
    }
    if (fichier.size > TAILLE_MAX_OCTETS || fichier.buffer.length > TAILLE_MAX_OCTETS) {
      throw new BadRequestException('Fichier trop volumineux (10 Mo maximum)');
    }

    const nom = (fichier.originalname ?? '').toLowerCase();
    // Une double extension (`recu.pdf.php`) doit être détectée : on examine
    // TOUS les segments, pas seulement le dernier.
    const segments = nom.split('.').slice(1).map((s) => '.' + s.trim());
    for (const segment of segments) {
      if (EXTENSIONS_INTERDITES.has(segment)) {
        throw new BadRequestException(
          `Type de fichier refusé (${segment}) : seules les images et les PDF sont acceptés.`,
        );
      }
    }

    const extension = segments.length ? segments[segments.length - 1] : '';
    if (!EXTENSIONS_AUTORISEES.has(extension)) {
      throw new BadRequestException(
        'Extension non autorisée : seules les images (jpg, png, gif, webp, heic) et les PDF sont acceptés.',
      );
    }

    const mimetype = (fichier.mimetype ?? '').toLowerCase().split(';')[0].trim();
    if (!MIMETYPES_AUTORISES.has(mimetype)) {
      throw new BadRequestException(
        `Type MIME non autorisé (${mimetype || 'inconnu'}) : seules les images et les PDF sont acceptés.`,
      );
    }
  }

  /** SHA256 du contenu binaire : identifie une preuve indépendamment de son nom. */
  private calculerHash(contenu: Buffer): string {
    return crypto.createHash('sha256').update(contenu).digest('hex');
  }

  /**
   * Téléverse une preuve de paiement.
   *
   * - le SHA256 du contenu est calculé et comparé aux preuves existantes :
   *   une même capture d'écran ne peut pas servir deux fois (fraude classique
   *   consistant à réutiliser le reçu d'un tiers) ;
   * - les fichiers interprétables sont refusés ;
   * - le fichier est écrit dans un dossier PRIVÉ, sous un nom aléatoire, hors
   *   de toute arborescence servie en statique.
   *
   * Le téléversement d'une preuve n'active RIEN : seul un administrateur (ou
   * un webhook signé) peut faire passer le paiement à REUSSI.
   */
  async televerserPreuve(
    dto: UploadProofDto,
    fichier: Express.Multer.File,
    tenantId?: string,
    userId?: string,
  ): Promise<IPreuve> {
    const paiement = await this.prisma.paiement.findUnique({ where: { id: dto.paiementId } });
    if (!paiement || (tenantId && paiement.tenantId && paiement.tenantId !== tenantId)) {
      throw new NotFoundException('Paiement introuvable');
    }
    if (paiement.statut === PaiementStatut.REUSSI) {
      throw new BadRequestException('Ce paiement est déjà validé');
    }

    this.validerFichier(fichier);

    const hash = this.calculerHash(fichier.buffer);

    // Doublon : la même preuve a déjà été soumise, ici ou sur un autre paiement.
    const doublon = await this.prisma.paymentProof.findFirst({
      where: { hashSha256: hash },
      select: { id: true, paiementId: true },
    });
    if (doublon) {
      this.logger.warn(
        `Preuve en doublon refusée : hash ${hash.slice(0, 12)}… déjà soumis ` +
          `(preuve ${doublon.id}, paiement ${doublon.paiementId}), nouvelle tentative ` +
          `sur le paiement ${dto.paiementId} par l'utilisateur ${userId ?? 'inconnu'}`,
      );
      throw new ConflictException(
        'Cette preuve a déjà été soumise. Chaque justificatif ne peut servir qu\'une seule fois.',
      );
    }

    // Nom de fichier aléatoire : le nom d'origine, contrôlé par le client,
    // n'est jamais utilisé sur le disque. Extension normalisée depuis la
    // liste blanche.
    const nomOriginal = (fichier.originalname ?? '').toLowerCase();
    const extension = path.extname(nomOriginal);
    const extensionSure = EXTENSIONS_AUTORISEES.has(extension) ? extension : '.bin';
    const nomStockage = `${crypto.randomBytes(16).toString('hex')}${extensionSure}`;

    // Sous-dossier par date pour éviter des répertoires de millions d'entrées.
    const sousDossier = new Date().toISOString().slice(0, 7); // AAAA-MM
    const dossierCible = path.join(this.dossierPreuves, sousDossier);
    await fs.mkdir(dossierCible, { recursive: true });

    const cheminAbsolu = path.join(dossierCible, nomStockage);
    // Garde-fou anti-traversée : le chemin final doit rester sous la racine.
    if (!cheminAbsolu.startsWith(this.dossierPreuves + path.sep)) {
      throw new BadRequestException('Chemin de stockage invalide');
    }

    // 0o600 : lisible uniquement par le compte qui fait tourner l'API.
    await fs.writeFile(cheminAbsolu, fichier.buffer, { mode: 0o600 });

    const cheminRelatif = path.posix.join(sousDossier, nomStockage);

    try {
      const preuve = await this.prisma.paymentProof.create({
        data: {
          paiementId: dto.paiementId,
          cheminFichier: cheminRelatif,
          nomOriginal: fichier.originalname?.slice(0, 255) ?? null,
          mimeType: fichier.mimetype ?? null,
          tailleOctets: fichier.buffer.length,
          hashSha256: hash,
          referenceTexte: dto.referenceTexte ?? null,
          statut: ProofStatut.EN_ATTENTE,
        },
      });

      await this.prisma.paiement.update({
        where: { id: dto.paiementId },
        data: { statut: PaiementStatut.EN_COURS },
      });

      // Confirmation au client + alerte aux administrateurs : une validation
      // manuelle est requise, le téléversement n'active rien par lui-même.
      const metadata = (paiement.metadata ?? {}) as Record<string, any>;
      this.publier(PAYMENT_EVENTS.PREUVE_RECUE, {
        paiementId: paiement.id,
        tenantId: paiement.tenantId,
        reference: paiement.reference,
        montant: Number(paiement.montant),
        devise: paiement.devise,
        userId: userId ?? metadata.creePar ?? null,
        plan: metadata.plan ?? null,
        preuveId: preuve.id,
        referenceTexte: preuve.referenceTexte,
      });

      return this.versIPreuve(preuve);
    } catch (erreur) {
      // Ne pas laisser de fichier orphelin si l'insertion échoue.
      await fs.unlink(cheminAbsolu).catch(() => undefined);
      throw erreur;
    }
  }

  /** Preuves d'un paiement (sans les chemins de stockage). */
  async listerPreuves(paiementId?: string, statut?: ProofStatut): Promise<IPreuve[]> {
    const preuves = await this.prisma.paymentProof.findMany({
      where: {
        ...(paiementId ? { paiementId } : {}),
        ...(statut ? { statut } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return preuves.map((p) => this.versIPreuve(p));
  }

  /**
   * Validation administrative d'une preuve : c'est l'UN DES DEUX SEULS chemins
   * d'activation d'un paiement (l'autre étant le webhook signé). L'URL de
   * retour du navigateur n'active jamais rien.
   */
  async validerPreuve(
    preuveId: string,
    adminId: string,
    contexte: IContexteAudit = {},
  ): Promise<IPreuve> {
    const preuve = await this.prisma.paymentProof.findUnique({ where: { id: preuveId } });
    if (!preuve) {
      throw new NotFoundException('Preuve introuvable');
    }
    if (preuve.statut !== ProofStatut.EN_ATTENTE) {
      throw new BadRequestException(`Cette preuve a déjà été traitée (${preuve.statut})`);
    }

    const [preuveMaj] = await this.prisma.$transaction([
      this.prisma.paymentProof.update({
        where: { id: preuveId },
        data: {
          statut: ProofStatut.VALIDEE,
          revuPar: adminId,
          revuAt: new Date(),
          motifRejet: null,
        },
      }),
      this.prisma.paiement.update({
        where: { id: preuve.paiementId },
        data: {
          statut: PaiementStatut.REUSSI,
          validePar: adminId,
          valideAt: new Date(),
        },
      }),
    ]);

    this.logger.log(
      `Preuve ${preuveId} validée par ${adminId} (IP ${contexte.ipAddress ?? 'inconnue'}) — ` +
        `paiement ${preuve.paiementId} activé`,
    );

    await this.publierEvenementPreuve(PAYMENT_EVENTS.PREUVE_VALIDEE, preuve.paiementId, {
      preuveId,
      valideeAt: preuveMaj.revuAt ?? new Date(),
    });

    return this.versIPreuve(preuveMaj);
  }

  /** Rejet d'une preuve. Le motif est OBLIGATOIRE (contrôlé par le DTO). */
  async rejeterPreuve(
    preuveId: string,
    motifRejet: string,
    adminId: string,
    contexte: IContexteAudit = {},
  ): Promise<IPreuve> {
    const motif = (motifRejet ?? '').trim();
    if (!motif) {
      throw new BadRequestException('Le motif de rejet est obligatoire');
    }

    const preuve = await this.prisma.paymentProof.findUnique({ where: { id: preuveId } });
    if (!preuve) {
      throw new NotFoundException('Preuve introuvable');
    }
    if (preuve.statut !== ProofStatut.EN_ATTENTE) {
      throw new BadRequestException(`Cette preuve a déjà été traitée (${preuve.statut})`);
    }

    const preuveMaj = await this.prisma.paymentProof.update({
      where: { id: preuveId },
      data: {
        statut: ProofStatut.REJETEE,
        motifRejet: motif,
        revuPar: adminId,
        revuAt: new Date(),
      },
    });

    // Le paiement retombe en attente : le client peut soumettre une autre preuve.
    await this.prisma.paiement.update({
      where: { id: preuve.paiementId },
      data: { statut: PaiementStatut.EN_ATTENTE },
    });

    this.logger.log(
      `Preuve ${preuveId} rejetée par ${adminId} (IP ${contexte.ipAddress ?? 'inconnue'}) : ${motif}`,
    );

    await this.publierEvenementPreuve(PAYMENT_EVENTS.PREUVE_REJETEE, preuve.paiementId, {
      preuveId,
      motifRejet: motif,
      rejeteeAt: preuveMaj.revuAt ?? new Date(),
    });

    return this.versIPreuve(preuveMaj);
  }

  /**
   * Complète la charge utile d'un événement de preuve avec les données du
   * paiement associé (référence, montant, destinataire), puis publie.
   * La lecture supplémentaire est protégée : elle ne doit pas remettre en cause
   * une validation déjà écrite en base.
   */
  private async publierEvenementPreuve(
    evenement: string,
    paiementId: string,
    complement: Record<string, unknown>,
  ): Promise<void> {
    try {
      const paiement = await this.prisma.paiement.findUnique({ where: { id: paiementId } });
      if (!paiement) return;

      const metadata = (paiement.metadata ?? {}) as Record<string, any>;
      this.publier(evenement, {
        paiementId: paiement.id,
        tenantId: paiement.tenantId,
        reference: paiement.reference,
        montant: Number(paiement.montant),
        devise: paiement.devise,
        userId: metadata.creePar ?? null,
        plan: metadata.plan ?? null,
        ...complement,
      });
    } catch (erreur) {
      const message = erreur instanceof Error ? erreur.message : String(erreur);
      this.logger.error(
        `Événement ${evenement} non publié pour le paiement ${paiementId} : ${message}`,
      );
    }
  }

  /**
   * Lecture du fichier d'une preuve, pour la route admin de téléchargement.
   * Le chemin stocké est re-résolu et vérifié contre la racine privée : même
   * une valeur corrompue en base ne peut pas faire sortir de l'arborescence.
   */
  async lireFichierPreuve(
    preuveId: string,
  ): Promise<{ contenu: Buffer; mimeType: string; nomOriginal: string }> {
    const preuve = await this.prisma.paymentProof.findUnique({ where: { id: preuveId } });
    if (!preuve || !preuve.cheminFichier) {
      throw new NotFoundException('Fichier de preuve introuvable');
    }
    const cheminAbsolu = path.resolve(this.dossierPreuves, preuve.cheminFichier);
    if (!cheminAbsolu.startsWith(this.dossierPreuves + path.sep)) {
      throw new BadRequestException('Chemin de preuve invalide');
    }
    const contenu = await fs.readFile(cheminAbsolu);
    return {
      contenu,
      mimeType: preuve.mimeType ?? 'application/octet-stream',
      nomOriginal: preuve.nomOriginal ?? 'preuve',
    };
  }

  // ─── Transitions d'état (usage interne / webhook) ───────────────────────────

  /** Marque un paiement réussi. Appelé par WebhookService après vérifications. */
  async marquerReussi(
    paiementId: string,
    providerRef: string | null,
    payload: Prisma.InputJsonValue,
  ): Promise<IPaiement> {
    const paiement = await this.prisma.paiement.update({
      where: { id: paiementId },
      data: {
        statut: PaiementStatut.REUSSI,
        providerRef,
        valideAt: new Date(),
        validePar: 'WEBHOOK',
        webhookPayload: payload,
      },
    });
    return this.versIPaiement(paiement);
  }

  /** Marque un paiement en échec, avec la raison consignée dans metadata. */
  async marquerEchoue(
    paiementId: string,
    raison: string,
    payload: Prisma.InputJsonValue,
  ): Promise<IPaiement> {
    const existant = await this.prisma.paiement.findUnique({ where: { id: paiementId } });
    const paiement = await this.prisma.paiement.update({
      where: { id: paiementId },
      data: {
        statut: PaiementStatut.ECHOUE,
        webhookPayload: payload,
        metadata: {
          ...((existant?.metadata ?? {}) as Record<string, any>),
          raisonEchec: raison,
          echecLe: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });
    return this.versIPaiement(paiement);
  }
}
