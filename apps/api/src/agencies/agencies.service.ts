import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';

@Injectable()
export class AgenciesService {
  private readonly logger = new Logger(AgenciesService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAgencyDto, tenantId: string, createdBy: string) {
    const existing = await this.prisma.agency.findFirst({
      where: { code: dto.code, tenantId, networkId: dto.networkId },
    });
    if (existing) throw new ConflictException(`Le code agence "${dto.code}" est déjà utilisé dans ce réseau`);

    const agency = await this.prisma.agency.create({
      data: {
        name: dto.name,
        code: dto.code,
        address: dto.address || 'N/A',
        city: dto.city || 'N/A',
        region: undefined,
        country: dto.country || 'CI',
        phone: dto.phone || '',
        email: dto.email,
        networkId: dto.networkId,
        tenantId,
        managerId: dto.managerId,
        status: 'ACTIVE',
      },
    });

    await this.logAudit('CREATE', createdBy, tenantId, { agencyId: agency.id });
    return agency;
  }

  async findAll(tenantId: string, page?: number, limit?: number, search?: string, networkId?: string) {
    const p = Number(page) || 1;
    const l = Number(limit) || 20;
    const skip = (p - 1) * l;
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (networkId) where.networkId = networkId;

    const [data, total] = await Promise.all([
      this.prisma.agency.findMany({
        where,
        skip,
        take: l,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { agents: true } },
          network: { select: { id: true, name: true, operatorCode: true } },
        },
      }),
      this.prisma.agency.count({ where }),
    ]);

    return {
      data,
      meta: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
    };
  }

  async findById(id: string, tenantId: string) {
    const agency = await this.prisma.agency.findFirst({
      where: { id, tenantId },
      include: {
        agents: {
          where: { status: 'ACTIVE' },
          select: { id: true, agentCode: true, phoneNumber: true, status: true },
          take: 20,
        },
        network: { select: { id: true, name: true, operatorCode: true } },
        _count: { select: { agents: true } },
      },
    });
    if (!agency) throw new NotFoundException('Agence non trouvée');
    return agency;
  }

  async update(id: string, tenantId: string, dto: UpdateAgencyDto, updatedBy: string) {
    const agency = await this.prisma.agency.findFirst({ where: { id, tenantId } });
    if (!agency) throw new NotFoundException('Agence non trouvée');

    if (dto.code && dto.code !== agency.code) {
      const conflict = await this.prisma.agency.findFirst({
        where: { code: dto.code, tenantId, networkId: agency.networkId, id: { not: id } },
      });
      if (conflict) throw new ConflictException('Ce code agence est déjà utilisé');
    }

    const updated = await this.prisma.agency.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code && { code: dto.code }),
        ...(dto.address && { address: dto.address }),
        ...(dto.city && { city: dto.city }),
        ...(dto.country && { country: dto.country }),
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.managerId !== undefined && { managerId: dto.managerId }),
        ...(dto.isActive !== undefined && { status: dto.isActive ? 'ACTIVE' : 'INACTIVE' }),
      },
    });

    await this.logAudit('UPDATE', updatedBy, tenantId, { agencyId: id });
    return updated;
  }

  async remove(id: string, tenantId: string, deletedBy: string) {
    const agency = await this.prisma.agency.findFirst({ where: { id, tenantId } });
    if (!agency) throw new NotFoundException('Agence non trouvée');

    await this.prisma.agency.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    await this.logAudit('DELETE', deletedBy, tenantId, { agencyId: id });
    return { message: 'Agence désactivée avec succès' };
  }

  async getStatistics(id: string, tenantId: string) {
    const agency = await this.prisma.agency.findFirst({ where: { id, tenantId } });
    if (!agency) throw new NotFoundException('Agence non trouvée');

    const [agentCount, activeAgentCount, totalFloat] = await Promise.all([
      this.prisma.agent.count({ where: { agencyId: id } }),
      this.prisma.agent.count({ where: { agencyId: id, status: 'ACTIVE' } }),
      this.prisma.floatAccount.aggregate({
        where: { agencyId: id },
        _sum: { balance: true },
      }),
    ]);

    return {
      agencyId: id,
      name: agency.name,
      agentCount,
      activeAgentCount,
      totalFloatBalance: totalFloat._sum.balance || 0,
    };
  }

  async assignAgent(agencyId: string, agentId: string, tenantId: string, assignedBy: string) {
    const [agency, agent] = await Promise.all([
      this.prisma.agency.findFirst({ where: { id: agencyId, tenantId } }),
      this.prisma.agent.findFirst({ where: { id: agentId, tenantId } }),
    ]);

    if (!agency) throw new NotFoundException('Agence non trouvée');
    if (!agent) throw new NotFoundException('Agent non trouvé');

    await this.prisma.agent.update({
      where: { id: agentId },
      data: { agencyId },
    });

    await this.logAudit('UPDATE', assignedBy, tenantId, { agencyId, agentId, action: 'AGENT_ASSIGNED' });
    return { message: 'Agent assigné à l\'agence avec succès' };
  }

  private async logAudit(action: string, userId: string, tenantId: string, details: any) {
    try {
      const actionMap: Record<string, any> = {
        CREATE: 'CREATE',
        UPDATE: 'UPDATE',
        DELETE: 'DELETE',
      };
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: actionMap[action] || 'UPDATE',
          resource: 'agencies',
          description: JSON.stringify(details),
        },
      });
    } catch (e) {
      this.logger.warn(`AuditLog erreur: ${e.message}`);
    }
  }
}
