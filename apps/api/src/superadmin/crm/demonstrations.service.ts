import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma, DemoStatut } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { normaliserPagination } from '../../common/utils/pagination';
import {
  CreateDemonstrationDto,
  UpdateDemonstrationDto,
  ChangerStatutDemoDto,
} from './dto/demonstration.dto';

const INCLUDE_PROSPECT = {
  prospect: {
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      pays: true,
    },
  },
} as const;

@Injectable()
export class DemonstrationsService {
  private readonly logger = new Logger(DemonstrationsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: unknown;
    limit?: unknown;
    search?: string;
    statut?: string;
    mode?: string;
  }) {
    const { page, limit, skip } = normaliserPagination(query.page, query.limit, 20);
    const where: Prisma.DemonstrationWhereInput = {};

    if (query.statut) where.statut = query.statut as DemoStatut;
    if (query.mode) where.mode = query.mode as any;

    if (query.search) {
      where.OR = [
        { entreprise: { contains: query.search, mode: 'insensitive' } },
        { prospect: { nom: { contains: query.search, mode: 'insensitive' } } },
        { prospect: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.demonstration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: INCLUDE_PROSPECT,
      }),
      this.prisma.demonstration.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStats() {
    const [total, parStatut] = await Promise.all([
      this.prisma.demonstration.count(),
      this.prisma.demonstration.groupBy({
        by: ['statut'],
        _count: { _all: true },
      }),
    ]);

    const compteur = (s: DemoStatut) =>
      parStatut.find((g) => g.statut === s)?._count._all ?? 0;

    const planifiees = compteur('PLANIFIEE') + compteur('CONFIRMEE');
    const realisees = compteur('REALISEE');
    const annulees = compteur('ANNULEE') + compteur('NO_SHOW') + compteur('REPORTEE');
    const passees = realisees + annulees;

    return {
      total,
      planifiees,
      realisees,
      annulees,
      tauxRealisation: passees > 0 ? Math.round((realisees / passees) * 100) : 0,
    };
  }

  async findOne(id: string) {
    const demo = await this.prisma.demonstration.findUnique({
      where: { id },
      include: INCLUDE_PROSPECT,
    });
    if (!demo) throw new NotFoundException('Démonstration non trouvée');
    return demo;
  }

  async create(dto: CreateDemonstrationDto) {
    const demo = await this.prisma.demonstration.create({
      data: {
        ...dto,
        date: new Date(dto.date),
      },
      include: INCLUDE_PROSPECT,
    });
    this.logger.log(`Démonstration créée: ${demo.id}`);
    return demo;
  }

  async update(id: string, dto: UpdateDemonstrationDto) {
    await this.ensureExists(id);
    return this.prisma.demonstration.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: INCLUDE_PROSPECT,
    });
  }

  async changerStatut(id: string, dto: ChangerStatutDemoDto) {
    await this.ensureExists(id);
    return this.prisma.demonstration.update({
      where: { id },
      data: {
        statut: dto.statut,
        ...(dto.compteRendu !== undefined ? { compteRendu: dto.compteRendu } : {}),
      },
      include: INCLUDE_PROSPECT,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.demonstration.delete({ where: { id } });
    return { message: 'Démonstration supprimée' };
  }

  private async ensureExists(id: string) {
    const d = await this.prisma.demonstration.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!d) throw new NotFoundException('Démonstration non trouvée');
  }
}
