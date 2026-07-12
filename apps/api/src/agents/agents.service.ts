import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { QueryAgentDto } from './dto/query-agent.dto';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAgentDto, tenantId: string, createdBy: string) {
    // Vérifier que l'utilisateur n'est pas déjà agent
    if (dto.userId) {
      const existingAgent = await this.prisma.agent.findUnique({
        where: { userId: dto.userId },
      });
      if (existingAgent) throw new ConflictException('Cet utilisateur est déjà enregistré comme agent');
    }

    // Vérifier unicité du code
    const existing = await this.prisma.agent.findFirst({
      where: { agentCode: dto.code, tenantId },
    });
    if (existing) throw new ConflictException(`Le code agent "${dto.code}" est déjà utilisé`);

    // Vérifier l'agence
    const agency = await this.prisma.agency.findFirst({
      where: { id: dto.agencyId, tenantId },
    });
    if (!agency) throw new NotFoundException('Agence non trouvée');

    // Le userId est obligatoire dans le schéma réel
    if (!dto.userId) throw new BadRequestException('L\'ID utilisateur est requis pour créer un agent');

    const agent = await this.prisma.agent.create({
      data: {
        tenantId,
        agencyId: dto.agencyId,
        userId: dto.userId,
        agentCode: dto.code,
        phoneNumber: dto.phone,
        nationalId: dto.code, // code utilisé comme nationalId par défaut
        address: dto.zone || 'N/A',
        status: 'ACTIVE',
      },
      include: {
        agency: { select: { id: true, name: true } },
      },
    });

    await this.logAudit('CREATE', createdBy, tenantId, { agentId: agent.id });
    return agent;
  }

  async findAll(query: QueryAgentDto, tenantId: string) {
    const p = Number(query.page) || 1;
    const l = Number(query.limit) || 20;
    const { search, agencyId, networkId, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (p - 1) * l;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { agentCode: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
      ];
    }

    if (agencyId) where.agencyId = agencyId;
    if (status) where.status = status;
    if (networkId) where.agency = { networkId };

    const [agents, total] = await Promise.all([
      this.prisma.agent.findMany({
        where,
        skip,
        take: l,
        orderBy: { [sortBy]: sortOrder },
        include: {
          agency: { select: { id: true, name: true, networkId: true } },
          floatAccounts: { select: { id: true, balance: true, currency: true } },
          _count: { select: { transactions: true } },
        },
      }),
      this.prisma.agent.count({ where }),
    ]);

    // Join user data (Agent has userId but no Prisma relation defined)
    const userIds = agents.map((a: any) => a.userId).filter(Boolean);
    const users = userIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const data = agents.map((a: any) => {
      const u = userMap[a.userId] ?? {};
      return {
        ...a,
        prenom: (u as any).firstName ?? '',
        nom: (u as any).lastName ?? '',
        email: (u as any).email ?? '',
        telephone: a.phoneNumber,
        agenceId: a.agencyId,
        agenceNom: a.agency?.name ?? '',
        actif: a.status === 'ACTIVE',
        enLigne: false,
        nbTransactionsAujourdhui: a._count?.transactions ?? 0,
        montantTransactionsAujourdhui: 0,
        commission: 0,
        createdAt: a.createdAt,
      };
    });

    return {
      data,
      meta: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
    };
  }

  async findById(id: string, tenantId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, tenantId },
      include: {
        agency: { select: { id: true, name: true } },
        floatAccounts: true,
        _count: { select: { transactions: true, commissionEarnings: true } },
      },
    });
    if (!agent) throw new NotFoundException('Agent non trouvé');
    return agent;
  }

  async update(id: string, tenantId: string, dto: UpdateAgentDto, updatedBy: string) {
    const agent = await this.prisma.agent.findFirst({ where: { id, tenantId } });
    if (!agent) throw new NotFoundException('Agent non trouvé');

    if (dto.code && dto.code !== agent.agentCode) {
      const codeConflict = await this.prisma.agent.findFirst({
        where: { agentCode: dto.code, tenantId, id: { not: id } },
      });
      if (codeConflict) throw new ConflictException('Ce code agent est déjà utilisé');
    }

    const updated = await this.prisma.agent.update({
      where: { id },
      data: {
        ...(dto.code && { agentCode: dto.code }),
        ...(dto.phone && { phoneNumber: dto.phone }),
        ...(dto.agencyId && { agencyId: dto.agencyId }),
        ...(dto.zone && { address: dto.zone }),
      },
      include: {
        agency: { select: { id: true, name: true } },
      },
    });

    await this.logAudit('UPDATE', updatedBy, tenantId, { agentId: id });
    return updated;
  }

  async remove(id: string, tenantId: string, deletedBy: string) {
    const agent = await this.prisma.agent.findFirst({ where: { id, tenantId } });
    if (!agent) throw new NotFoundException('Agent non trouvé');

    await this.prisma.agent.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    await this.logAudit('DELETE', deletedBy, tenantId, { agentId: id });
    return { message: 'Agent désactivé avec succès' };
  }

  async suspend(id: string, tenantId: string, reason: string, suspendedBy: string) {
    const agent = await this.prisma.agent.findFirst({ where: { id, tenantId } });
    if (!agent) throw new NotFoundException('Agent non trouvé');

    if (agent.status === 'SUSPENDED') {
      throw new BadRequestException('L\'agent est déjà suspendu');
    }

    await this.prisma.agent.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });

    await this.logAudit('SUSPEND', suspendedBy, tenantId, { agentId: id, reason });
    return { message: 'Agent suspendu avec succès' };
  }

  async activate(id: string, tenantId: string, activatedBy: string) {
    const agent = await this.prisma.agent.findFirst({ where: { id, tenantId } });
    if (!agent) throw new NotFoundException('Agent non trouvé');

    await this.prisma.agent.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    await this.logAudit('ACTIVATE', activatedBy, tenantId, { agentId: id });
    return { message: 'Agent réactivé avec succès' };
  }

  async getTransactions(id: string, tenantId: string, page = 1, limit = 20) {
    const agent = await this.prisma.agent.findFirst({ where: { id, tenantId } });
    if (!agent) throw new NotFoundException('Agent non trouvé');

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { agentId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where: { agentId: id } }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getCommissions(id: string, tenantId: string, page = 1, limit = 20) {
    const agent = await this.prisma.agent.findFirst({ where: { id, tenantId } });
    if (!agent) throw new NotFoundException('Agent non trouvé');

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.commissionEarning.findMany({
        where: { agentId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { transaction: { select: { reference: true, type: true, amount: true } } },
      }),
      this.prisma.commissionEarning.count({ where: { agentId: id } }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getFloat(id: string, tenantId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        agentCode: true,
        status: true,
        floatAccounts: {
          select: {
            id: true,
            accountNumber: true,
            balance: true,
            reservedBalance: true,
            minimumBalance: true,
            maximumBalance: true,
            currency: true,
            lastMovementAt: true,
          },
        },
      },
    });
    if (!agent) throw new NotFoundException('Agent non trouvé');
    return agent;
  }

  private async logAudit(action: string, userId: string, tenantId: string, details: any) {
    try {
      const actionMap: Record<string, any> = {
        CREATE: 'CREATE',
        UPDATE: 'UPDATE',
        DELETE: 'DELETE',
        SUSPEND: 'SUSPEND',
        ACTIVATE: 'ACTIVATE',
      };
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: actionMap[action] || 'UPDATE',
          resource: 'agents',
          description: JSON.stringify(details),
        },
      });
    } catch (e) {
      this.logger.warn(`AuditLog erreur: ${e.message}`);
    }
  }
}
