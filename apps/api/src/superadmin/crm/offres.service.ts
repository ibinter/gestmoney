import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma, OffreStatut } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { normaliserPagination } from '../../common/utils/pagination';
import {
  CreateOffreDto,
  UpdateOffreDto,
} from './dto/offre.dto';

const INCLUDE_PROSPECT = {
  prospect: {
    select: { id: true, nom: true, prenom: true, email: true, pays: true },
  },
} as const;

type OffreBrute = Prisma.OffreGetPayload<{ include: typeof INCLUDE_PROSPECT }>;

@Injectable()
export class OffresService {
  private readonly logger = new Logger(OffresService.name);

  constructor(private prisma: PrismaService) {}

  /** Convertit les Decimal Prisma en number avant renvoi au front. */
  private serialiser(o: OffreBrute) {
    return {
      ...o,
      prixHT: Number(o.prixHT),
      remise: Number(o.remise),
      taxes: Number(o.taxes),
      prixTTC: Number(o.prixTTC),
      dateExpiration: new Date(
        o.createdAt.getTime() + o.validiteJours * 86400000,
      ).toISOString(),
    };
  }

  async findAll(query: {
    page?: unknown;
    limit?: unknown;
    search?: string;
    statut?: string;
  }) {
    const { page, limit, skip } = normaliserPagination(query.page, query.limit, 20);
    const where: Prisma.OffreWhereInput = {};

    if (query.statut) where.statut = query.statut as OffreStatut;

    if (query.search) {
      where.OR = [
        { reference: { contains: query.search, mode: 'insensitive' } },
        { entreprise: { contains: query.search, mode: 'insensitive' } },
        { prospect: { nom: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.offre.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: INCLUDE_PROSPECT,
      }),
      this.prisma.offre.count({ where }),
    ]);

    return {
      data: data.map((o) => this.serialiser(o)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStats() {
    const offres = await this.prisma.offre.findMany({
      select: { statut: true, prixHT: true, remise: true },
    });

    const netApresRemise = (prixHT: Prisma.Decimal, remise: Prisma.Decimal) =>
      Number(prixHT) * (1 - Number(remise) / 100);

    let pipeline = 0;
    let converties = 0;
    let enCours = 0;
    let horsBrouillon = 0;

    for (const o of offres) {
      if (o.statut !== 'BROUILLON') horsBrouillon += 1;
      if (o.statut === 'CONVERTIE' || o.statut === 'ACCEPTEE') {
        converties += 1;
      }
      if (
        o.statut === 'ENVOYEE' ||
        o.statut === 'CONSULTEE'
      ) {
        enCours += 1;
        pipeline += netApresRemise(o.prixHT, o.remise);
      }
    }

    return {
      total: offres.length,
      pipeline: Math.round(pipeline),
      converties,
      enCours,
      tauxConversion:
        horsBrouillon > 0 ? Math.round((converties / horsBrouillon) * 100) : 0,
    };
  }

  async findOne(id: string) {
    const offre = await this.prisma.offre.findUnique({
      where: { id },
      include: INCLUDE_PROSPECT,
    });
    if (!offre) throw new NotFoundException('Offre non trouvée');
    return this.serialiser(offre);
  }

  async create(dto: CreateOffreDto) {
    const reference =
      dto.reference?.trim() || `OFF-${Date.now().toString(36).toUpperCase()}`;

    const existante = await this.prisma.offre.findUnique({ where: { reference } });
    if (existante) throw new ConflictException(`La référence "${reference}" existe déjà`);

    const prixHT = dto.prixHT;
    const remise = dto.remise ?? 0;
    const taxes = dto.taxes ?? 0;
    const prixTTC =
      dto.prixTTC ?? Math.round(prixHT * (1 - remise / 100) * (1 + taxes / 100));

    const offre = await this.prisma.offre.create({
      data: {
        reference,
        prospectId: dto.prospectId,
        demonstrationId: dto.demonstrationId,
        entreprise: dto.entreprise,
        logiciel: dto.logiciel,
        formule: dto.formule,
        modules: (dto.modules ?? []) as Prisma.InputJsonValue,
        nbUtilisateurs: dto.nbUtilisateurs,
        nbSites: dto.nbSites,
        dureesMois: dto.dureesMois,
        devise: dto.devise,
        prixHT: new Prisma.Decimal(prixHT),
        remise: new Prisma.Decimal(remise),
        taxes: new Prisma.Decimal(taxes),
        prixTTC: new Prisma.Decimal(prixTTC),
        formation: dto.formation,
        migration: dto.migration,
        accompagnement: dto.accompagnement,
        validiteJours: dto.validiteJours,
        conditions: dto.conditions,
        statut: dto.statut,
      },
      include: INCLUDE_PROSPECT,
    });

    this.logger.log(`Offre créée: ${offre.reference}`);
    return this.serialiser(offre);
  }

  async update(id: string, dto: UpdateOffreDto) {
    const actuelle = await this.prisma.offre.findUnique({ where: { id } });
    if (!actuelle) throw new NotFoundException('Offre non trouvée');

    // Recalcule le TTC si l'un des paramètres de prix change et qu'aucun TTC
    // explicite n'est fourni.
    const prixHT = dto.prixHT ?? Number(actuelle.prixHT);
    const remise = dto.remise ?? Number(actuelle.remise);
    const taxes = dto.taxes ?? Number(actuelle.taxes);
    const prixTTC =
      dto.prixTTC ?? Math.round(prixHT * (1 - remise / 100) * (1 + taxes / 100));

    const offre = await this.prisma.offre.update({
      where: { id },
      data: {
        ...(dto.reference !== undefined ? { reference: dto.reference } : {}),
        ...(dto.prospectId !== undefined ? { prospectId: dto.prospectId } : {}),
        ...(dto.demonstrationId !== undefined
          ? { demonstrationId: dto.demonstrationId }
          : {}),
        ...(dto.entreprise !== undefined ? { entreprise: dto.entreprise } : {}),
        ...(dto.logiciel !== undefined ? { logiciel: dto.logiciel } : {}),
        ...(dto.formule !== undefined ? { formule: dto.formule } : {}),
        ...(dto.modules !== undefined
          ? { modules: dto.modules as Prisma.InputJsonValue }
          : {}),
        ...(dto.nbUtilisateurs !== undefined
          ? { nbUtilisateurs: dto.nbUtilisateurs }
          : {}),
        ...(dto.nbSites !== undefined ? { nbSites: dto.nbSites } : {}),
        ...(dto.dureesMois !== undefined ? { dureesMois: dto.dureesMois } : {}),
        ...(dto.devise !== undefined ? { devise: dto.devise } : {}),
        prixHT: new Prisma.Decimal(prixHT),
        remise: new Prisma.Decimal(remise),
        taxes: new Prisma.Decimal(taxes),
        prixTTC: new Prisma.Decimal(prixTTC),
        ...(dto.formation !== undefined ? { formation: dto.formation } : {}),
        ...(dto.migration !== undefined ? { migration: dto.migration } : {}),
        ...(dto.accompagnement !== undefined
          ? { accompagnement: dto.accompagnement }
          : {}),
        ...(dto.validiteJours !== undefined
          ? { validiteJours: dto.validiteJours }
          : {}),
        ...(dto.conditions !== undefined ? { conditions: dto.conditions } : {}),
        ...(dto.statut !== undefined ? { statut: dto.statut } : {}),
      },
      include: INCLUDE_PROSPECT,
    });

    return this.serialiser(offre);
  }

  async changerStatut(id: string, statut: OffreStatut) {
    await this.ensureExists(id);
    const offre = await this.prisma.offre.update({
      where: { id },
      data: {
        statut,
        ...(statut === 'ACCEPTEE' ? { accepteeAt: new Date() } : {}),
      },
      include: INCLUDE_PROSPECT,
    });
    return this.serialiser(offre);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.offre.delete({ where: { id } });
    return { message: 'Offre supprimée' };
  }

  private async ensureExists(id: string) {
    const o = await this.prisma.offre.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!o) throw new NotFoundException('Offre non trouvée');
  }
}
