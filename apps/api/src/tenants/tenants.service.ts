import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/create-tenant.dto';
import { normaliserPagination } from '../common/utils/pagination';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto, createdBy: string) {
    const existing = await this.prisma.tenant.findFirst({
      where: { slug: dto.id },
    });
    if (existing) throw new ConflictException(`Le tenant "${dto.id}" existe déjà`);

    const tenant = await this.prisma.tenant.create({
      data: {
        slug: dto.id,
        name: dto.name,
        country: dto.country || 'CI',
        currency: dto.currency || 'XOF',
        locale: dto.defaultLocale || 'fr-CI',
        logo: dto.logoUrl,
        status: dto.isActive !== false ? 'ACTIVE' : 'SUSPENDED',
        plan: 'STARTER',
      },
    });

    this.logger.log(`Tenant créé: ${dto.id} par ${createdBy}`);
    return tenant;
  }

  async findAll(page?: number, limit?: number, search?: string) {
    const { page: p, limit: l, skip } = normaliserPagination(page, limit, 20);
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, agencies: true, agents: true } },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data,
      meta: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
    };
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, agencies: true, agents: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant non trouvé');
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        _count: { select: { users: true, agencies: true, agents: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant non trouvé');
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto, updatedBy: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant non trouvé');

    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.country && { country: dto.country }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.defaultLocale && { locale: dto.defaultLocale }),
        ...(dto.logoUrl !== undefined && { logo: dto.logoUrl }),
        ...(dto.isActive !== undefined && {
          status: dto.isActive ? 'ACTIVE' : 'SUSPENDED',
        }),
      },
    });
  }

  async deactivate(id: string, deactivatedBy: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant non trouvé');

    await this.prisma.tenant.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });

    return { message: 'Tenant suspendu avec succès' };
  }

  /**
   * Statistiques globales de la plateforme, pour la console SuperAdmin.
   *
   * La forme renvoyée est celle qu'attend la page : { tenants, utilisateurs,
   * transactions, revenus, tickets, sante }. Les blocs sans source de données
   * réelle valent `null` — la page affiche alors « — ». On ne renvoie JAMAIS
   * de valeur inventée : un MRR ou un taux de disponibilité fabriqué
   * induirait un administrateur en erreur sur la santé de son activité.
   */
  async getStatsGlobales() {
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);
    const debutMois = new Date(debutJour.getFullYear(), debutJour.getMonth(), 1);

    const [
      tenantsTotal, tenantsActifs, tenantsEssai, tenantsExpires,
      usersTotal, usersActifs, usersSuspendus,
      txJour, txMois, montantJour,
      paiementsEnAttente,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      this.prisma.tenant.count({ where: { status: 'TRIAL' } }),
      this.prisma.tenant.count({ where: { status: 'EXPIRED' } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.transaction.count({ where: { createdAt: { gte: debutJour } } }),
      this.prisma.transaction.count({ where: { createdAt: { gte: debutMois } } }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: debutJour } },
      }),
      this.prisma.paiement.aggregate({
        _sum: { montant: true },
        where: { statut: 'EN_ATTENTE' },
      }),
    ]);

    return {
      tenants: {
        total: tenantsTotal,
        actifs: tenantsActifs,
        essai: tenantsEssai,
        expires: tenantsExpires,
      },
      utilisateurs: {
        total: usersTotal,
        actifs: usersActifs,
        suspendus: usersSuspendus,
      },
      transactions: {
        aujourd_hui: txJour,
        montant_aujourd_hui: Number(montantJour._sum.amount ?? 0),
        ce_mois: txMois,
      },
      revenus: {
        // Aucun moteur d'abonnement récurrent n'alimente encore de MRR/ARR
        // fiable : on les laisse à null plutôt que d'afficher un chiffre faux.
        mrr: null,
        arr: null,
        en_attente: Number(paiementsEnAttente._sum.montant ?? 0),
      },
      // Aucun module de ticketing ni de supervision branché à ce jour.
      tickets: null,
      sante: null,
    };
  }

  async getStats(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant non trouvé');

    const [userCount, agencyCount, agentCount, networkCount] = await Promise.all([
      this.prisma.user.count({ where: { tenantId: id } }),
      this.prisma.agency.count({ where: { tenantId: id } }),
      this.prisma.agent.count({ where: { tenantId: id } }),
      this.prisma.network.count({ where: { tenantId: id } }),
    ]);

    return {
      tenantId: id,
      name: tenant.name,
      status: tenant.status,
      plan: tenant.plan,
      userCount,
      agencyCount,
      agentCount,
      networkCount,
    };
  }
}
