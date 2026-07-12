import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/create-tenant.dto';

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

  async findAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
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
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, agencies: true, agents: true } },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
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
