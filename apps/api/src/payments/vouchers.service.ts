import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Voucher, VoucherStatut } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { GenererVouchersDto, ListVouchersQueryDto } from './dto/voucher.dto';

/**
 * Alphabet des codes : chiffres et majuscules SANS les caractères ambigus
 * (0/O, 1/I/L) — un code se lit et se dicte au téléphone.
 */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
/** 16 caractères sur 31 symboles ≈ 79 bits d'entropie : non énumérable. */
const LONGUEUR_CODE = 16;
/** Taille des groupes séparés par un tiret, pour la lisibilité. */
const TAILLE_GROUPE = 4;

export interface IVoucher {
  id: string;
  tenantId: string | null;
  code: string;
  lot: string | null;
  plan: string | null;
  /** Decimal Prisma converti en nombre. */
  valeur: number;
  devise: string;
  dureeJours: number;
  statut: VoucherStatut;
  utilisePar: string | null;
  utiliseAt: Date | null;
  expireAt: Date | null;
  createdAt: Date;
}

export interface IResultatConsommation {
  voucherId: string;
  code: string;
  valeur: number;
  devise: string;
  plan: string | null;
  dureeJours: number;
  utiliseAt: Date;
}

@Injectable()
export class VouchersService {
  private readonly logger = new Logger(VouchersService.name);

  constructor(private readonly prisma: PrismaService) {}

  private versIVoucher(v: Voucher): IVoucher {
    return { ...v, valeur: Number(v.valeur) };
  }

  // ─── Génération ─────────────────────────────────────────────────────────────

  /**
   * Tire un code aléatoire NON DEVINABLE.
   *
   * `crypto.randomBytes` et non `Math.random` : ce dernier utilise un PRNG non
   * cryptographique dont l'état interne se reconstruit à partir de quelques
   * sorties observées — un acheteur légitime pourrait alors prédire les codes
   * des autres lots. Le rejet des octets hors du plus grand multiple de
   * l'alphabet évite en outre le biais du modulo.
   */
  private genererCode(): string {
    const limite = 256 - (256 % ALPHABET.length);
    const caracteres: string[] = [];

    while (caracteres.length < LONGUEUR_CODE) {
      const octets = crypto.randomBytes(LONGUEUR_CODE * 2);
      for (const octet of octets) {
        if (octet >= limite) continue; // biais du modulo écarté
        caracteres.push(ALPHABET[octet % ALPHABET.length]);
        if (caracteres.length === LONGUEUR_CODE) break;
      }
    }

    const groupes: string[] = [];
    for (let i = 0; i < caracteres.length; i += TAILLE_GROUPE) {
      groupes.push(caracteres.slice(i, i + TAILLE_GROUPE).join(''));
    }
    return groupes.join('-');
  }

  /**
   * Génère un lot de vouchers.
   *
   * Les collisions sont impossibles en pratique mais restent arbitrées par la
   * contrainte @unique sur `code` : `createMany` avec `skipDuplicates`, puis on
   * complète le lot jusqu'à atteindre la quantité demandée.
   */
  async genererLot(dto: GenererVouchersDto, adminId?: string): Promise<{
    lot: string;
    quantite: number;
    vouchers: IVoucher[];
  }> {
    const lot =
      dto.lot?.trim() ||
      `LOT-${new Date().toISOString().slice(0, 10)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const expireAt = dto.validiteJours
      ? new Date(Date.now() + dto.validiteJours * 24 * 60 * 60 * 1000)
      : null;

    const base = {
      tenantId: dto.tenantId ?? null,
      lot,
      plan: dto.plan ?? null,
      valeur: new Prisma.Decimal(dto.valeur),
      devise: (dto.devise ?? 'XOF').toUpperCase(),
      dureeJours: dto.dureeJours ?? 30,
      statut: VoucherStatut.DISPONIBLE,
      expireAt,
    };

    let restants = dto.quantite;
    let tentatives = 0;

    while (restants > 0 && tentatives < 10) {
      tentatives++;
      const codes = new Set<string>();
      while (codes.size < restants) codes.add(this.genererCode());

      const resultat = await this.prisma.voucher.createMany({
        data: Array.from(codes).map((code) => ({ ...base, code })),
        skipDuplicates: true,
      });
      restants -= resultat.count;
    }

    if (restants > 0) {
      throw new ConflictException(
        `Impossible de générer ${dto.quantite} codes uniques (${restants} manquants)`,
      );
    }

    const vouchers = await this.prisma.voucher.findMany({
      where: { lot },
      orderBy: { createdAt: 'asc' },
    });

    this.logger.log(
      `Lot ${lot} : ${vouchers.length} vouchers générés par ${adminId ?? 'système'}`,
    );

    return { lot, quantite: vouchers.length, vouchers: vouchers.map((v) => this.versIVoucher(v)) };
  }

  // ─── Validation ─────────────────────────────────────────────────────────────

  private normaliser(code: string): string {
    return (code ?? '').trim().toUpperCase();
  }

  /**
   * Vérifie qu'un code est utilisable, SANS le consommer.
   *
   * À n'utiliser que pour un affichage (« ce code vaut X »). L'appel à
   * `consommer()` refait toutes les vérifications de manière atomique : il ne
   * faut jamais se contenter d'un `valider()` suivi d'une écriture.
   */
  async valider(code: string): Promise<IVoucher> {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code: this.normaliser(code) },
    });
    if (!voucher) {
      throw new NotFoundException('Code invalide');
    }
    if (voucher.statut !== VoucherStatut.DISPONIBLE) {
      throw new BadRequestException(
        voucher.statut === VoucherStatut.UTILISE
          ? 'Code déjà utilisé'
          : `Code indisponible (${voucher.statut})`,
      );
    }
    if (voucher.expireAt && voucher.expireAt.getTime() < Date.now()) {
      throw new BadRequestException('Code expiré');
    }
    return this.versIVoucher(voucher);
  }

  // ─── Consommation atomique ──────────────────────────────────────────────────

  /**
   * Consomme un code, une seule fois, quelle que soit la concurrence.
   *
   * L'implémentation repose sur un `updateMany` CONDITIONNEL : la clause
   * `statut: DISPONIBLE` fait partie du WHERE de l'UPDATE, donc c'est la base
   * qui arbitre. Si deux requêtes arrivent en même temps avec le même code, la
   * première fait passer le statut à UTILISE et obtient `count === 1` ; la
   * seconde ne trouve plus de ligne correspondant au WHERE et obtient
   * `count === 0` : elle est rejetée.
   *
   * Un « lire puis écrire » (findUnique, tester le statut, puis update) serait
   * FAUX : les deux requêtes liraient DISPONIBLE avant que l'une des deux
   * n'écrive, et le code serait consommé deux fois.
   */
  async consommer(code: string, userId: string, tenantId?: string): Promise<IResultatConsommation> {
    const codeNormalise = this.normaliser(code);
    const maintenant = new Date();

    const resultat = await this.prisma.voucher.updateMany({
      where: {
        code: codeNormalise,
        // ── Conditions arbitrées par la base, pas par le code applicatif ──
        statut: VoucherStatut.DISPONIBLE,
        // Un voucher sans date d'expiration est valable sans limite ; sinon la
        // date doit être strictement dans le futur.
        OR: [{ expireAt: null }, { expireAt: { gt: maintenant } }],
        // Un voucher rattaché à un tenant n'est consommable que par ce tenant ;
        // un voucher global (tenantId null) est consommable par tous.
        ...(tenantId ? { AND: [{ OR: [{ tenantId }, { tenantId: null }] }] } : {}),
      },
      data: {
        statut: VoucherStatut.UTILISE,
        utilisePar: userId,
        utiliseAt: maintenant,
      },
    });

    if (resultat.count === 0) {
      // Aucune ligne mise à jour. On relit UNIQUEMENT pour produire un message
      // d'erreur utile — cette lecture n'intervient pas dans la décision.
      const voucher = await this.prisma.voucher.findUnique({ where: { code: codeNormalise } });
      if (!voucher) {
        throw new NotFoundException('Code invalide');
      }
      if (voucher.statut === VoucherStatut.UTILISE) {
        this.logger.warn(
          `Tentative de réutilisation du voucher ${voucher.id} par l'utilisateur ${userId}`,
        );
        throw new ConflictException('Code déjà utilisé');
      }
      if (voucher.expireAt && voucher.expireAt.getTime() <= maintenant.getTime()) {
        throw new BadRequestException('Code expiré');
      }
      throw new BadRequestException(`Code indisponible (${voucher.statut})`);
    }

    const voucher = await this.prisma.voucher.findUnique({ where: { code: codeNormalise } });

    this.logger.log(`Voucher ${voucher!.id} (lot ${voucher!.lot}) consommé par ${userId}`);

    return {
      voucherId: voucher!.id,
      code: voucher!.code,
      valeur: Number(voucher!.valeur),
      devise: voucher!.devise,
      plan: voucher!.plan,
      dureeJours: voucher!.dureeJours,
      utiliseAt: voucher!.utiliseAt!,
    };
  }

  /** Annule des vouchers encore disponibles (update conditionnel, là aussi). */
  async annulerLot(lot: string): Promise<{ annules: number }> {
    const resultat = await this.prisma.voucher.updateMany({
      where: { lot, statut: VoucherStatut.DISPONIBLE },
      data: { statut: VoucherStatut.ANNULE },
    });
    return { annules: resultat.count };
  }

  // ─── Consultation et export ─────────────────────────────────────────────────

  async lister(query: ListVouchersQueryDto, tenantId?: string): Promise<IVoucher[]> {
    const vouchers = await this.prisma.voucher.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(query.statut ? { statut: query.statut } : {}),
        ...(query.lot ? { lot: query.lot } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
    return vouchers.map((v) => this.versIVoucher(v));
  }

  /** Échappement CSV : guillemets doublés, champ entre guillemets. */
  private echapperCsv(valeur: any): string {
    if (valeur === null || valeur === undefined) return '""';
    return `"${String(valeur).replace(/"/g, '""')}"`;
  }

  /**
   * Export CSV d'un lot. Les codes en clair y figurent : la route qui l'appelle
   * est réservée aux administrateurs.
   */
  async exporterCsv(lot?: string, statut?: VoucherStatut): Promise<string> {
    const vouchers = await this.prisma.voucher.findMany({
      where: { ...(lot ? { lot } : {}), ...(statut ? { statut } : {}) },
      orderBy: { createdAt: 'asc' },
      take: 10000,
    });

    const entetes = [
      'code', 'lot', 'plan', 'valeur', 'devise', 'dureeJours',
      'statut', 'utilisePar', 'utiliseAt', 'expireAt', 'createdAt',
    ];

    const lignes = vouchers.map((v) =>
      [
        v.code, v.lot, v.plan, Number(v.valeur), v.devise, v.dureeJours,
        v.statut, v.utilisePar,
        v.utiliseAt?.toISOString() ?? '',
        v.expireAt?.toISOString() ?? '',
        v.createdAt.toISOString(),
      ]
        .map((c) => this.echapperCsv(c))
        .join(','),
    );

    // BOM UTF-8 : Excel ouvre correctement les accents.
    return '﻿' + [entetes.join(','), ...lignes].join('\r\n');
  }

  /** Statistiques d'un lot pour la console d'administration. */
  async statistiquesLot(lot: string) {
    const groupes = await this.prisma.voucher.groupBy({
      by: ['statut'],
      where: { lot },
      _count: { _all: true },
    });
    const total = groupes.reduce((somme, g) => somme + g._count._all, 0);
    return {
      lot,
      total,
      parStatut: groupes.reduce<Record<string, number>>((acc, g) => {
        acc[g.statut] = g._count._all;
        return acc;
      }, {}),
    };
  }
}
