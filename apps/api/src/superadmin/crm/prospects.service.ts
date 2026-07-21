import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma, ProspectStatut, OffreStatut } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { normaliserPagination } from '../../common/utils/pagination';
import {
  CreateProspectDto,
  UpdateProspectDto,
  ConvertirProspectDto,
} from './dto/prospect.dto';

@Injectable()
export class ProspectsService {
  private readonly logger = new Logger(ProspectsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: unknown;
    limit?: unknown;
    search?: string;
    statut?: string;
    priorite?: string;
    origine?: string;
  }) {
    const { page, limit, skip } = normaliserPagination(query.page, query.limit, 20);
    const where: Prisma.ProspectWhereInput = {};

    if (query.statut) where.statut = query.statut as ProspectStatut;
    if (query.priorite) where.priorite = query.priorite as any;
    if (query.origine) where.origine = query.origine as any;

    if (query.search) {
      where.OR = [
        { nom: { contains: query.search, mode: 'insensitive' } },
        { prenom: { contains: query.search, mode: 'insensitive' } },
        { entreprise: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.prospect.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { demonstrations: true, offres: true } },
        },
      }),
      this.prisma.prospect.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStats() {
    const [total, parStatut] = await Promise.all([
      this.prisma.prospect.count(),
      this.prisma.prospect.groupBy({
        by: ['statut'],
        _count: { _all: true },
      }),
    ]);

    const compteur = (s: ProspectStatut) =>
      parStatut.find((g) => g.statut === s)?._count._all ?? 0;

    const nouveaux = compteur('NOUVEAU');
    const enCours =
      compteur('A_CONTACTER') +
      compteur('CONTACTE') +
      compteur('QUALIFIE') +
      compteur('DEMO_PREVUE') +
      compteur('DEMO_REALISEE') +
      compteur('OFFRE_ENVOYEE') +
      compteur('NEGOCIATION') +
      compteur('A_RELANCER');
    const gagnes = compteur('GAGNE');
    const perdus = compteur('PERDU');

    return {
      total,
      nouveaux,
      enCours,
      gagnes,
      perdus,
      tauxConversion: total > 0 ? Math.round((gagnes / total) * 100) : 0,
    };
  }

  async findOne(id: string) {
    const prospect = await this.prisma.prospect.findUnique({
      where: { id },
      include: {
        demonstrations: { orderBy: { date: 'desc' } },
        offres: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!prospect) throw new NotFoundException('Prospect non trouvé');
    return prospect;
  }

  async create(dto: CreateProspectDto) {
    const prospect = await this.prisma.prospect.create({
      data: {
        ...dto,
        dateRelance: dto.dateRelance ? new Date(dto.dateRelance) : undefined,
      },
    });
    this.logger.log(`Prospect créé: ${prospect.id}`);
    return prospect;
  }

  async update(id: string, dto: UpdateProspectDto) {
    await this.ensureExists(id);
    return this.prisma.prospect.update({
      where: { id },
      data: {
        ...dto,
        dateRelance: dto.dateRelance ? new Date(dto.dateRelance) : undefined,
      },
    });
  }

  async changerStatut(id: string, statut: ProspectStatut) {
    await this.ensureExists(id);
    return this.prisma.prospect.update({
      where: { id },
      data: {
        statut,
        ...(statut === 'GAGNE' ? { convertedAt: new Date() } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.prospect.delete({ where: { id } });
    return { message: 'Prospect supprimé' };
  }

  /**
   * Conversion prospect → offre : crée une offre en brouillon rattachée au
   * prospect et bascule celui-ci en OFFRE_ENVOYEE. On ne fabrique aucun
   * montant : si aucun prix HT n'est fourni, l'offre reste à 0 (brouillon).
   */
  async convertir(id: string, dto: ConvertirProspectDto) {
    const prospect = await this.prisma.prospect.findUnique({ where: { id } });
    if (!prospect) throw new NotFoundException('Prospect non trouvé');

    const prixHT = dto.prixHT ?? 0;
    const remise = dto.remise ?? 0;
    const taxes = dto.taxes ?? 0;
    const prixTTC = Math.round(prixHT * (1 - remise / 100) * (1 + taxes / 100));

    const reference = `OFF-${Date.now().toString(36).toUpperCase()}`;

    const [offre] = await this.prisma.$transaction([
      this.prisma.offre.create({
        data: {
          reference,
          prospectId: prospect.id,
          entreprise: prospect.entreprise ?? `${prospect.prenom ?? ''} ${prospect.nom}`.trim(),
          logiciel: prospect.logiciel,
          formule: dto.formule,
          devise: dto.devise ?? 'XOF',
          prixHT: new Prisma.Decimal(prixHT),
          remise: new Prisma.Decimal(remise),
          taxes: new Prisma.Decimal(taxes),
          prixTTC: new Prisma.Decimal(prixTTC),
          validiteJours: dto.validiteJours ?? 30,
          statut: OffreStatut.BROUILLON,
        },
      }),
      this.prisma.prospect.update({
        where: { id: prospect.id },
        data: { statut: 'OFFRE_ENVOYEE', convertedAt: new Date() },
      }),
    ]);

    this.logger.log(`Prospect ${id} converti en offre ${offre.reference}`);
    return {
      ...offre,
      prixHT: Number(offre.prixHT),
      remise: Number(offre.remise),
      taxes: Number(offre.taxes),
      prixTTC: Number(offre.prixTTC),
    };
  }

  private async ensureExists(id: string) {
    const p = await this.prisma.prospect.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!p) throw new NotFoundException('Prospect non trouvé');
  }
}
