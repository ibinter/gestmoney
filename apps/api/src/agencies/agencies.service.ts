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
    // Le formulaire front ne fournit pas de réseau : on retombe sur le réseau
    // par défaut du tenant (premier réseau créé) quand networkId est absent.
    let networkId = dto.networkId;
    if (!networkId) {
      const defaultNetwork = await this.prisma.network.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (!defaultNetwork) {
        throw new NotFoundException('Aucun réseau disponible pour ce tenant');
      }
      networkId = defaultNetwork.id;
    }

    const existing = await this.prisma.agency.findFirst({
      where: { code: dto.code, tenantId, networkId },
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
        networkId,
        tenantId,
        managerId: dto.managerId,
        status: 'ACTIVE',
      },
    });

    await this.logAudit('CREATE', createdBy, tenantId, { agencyId: agency.id });
    // Onboarding : marquer etape2 (1ère agence créée) en fire-and-forget
    this.prisma.onboardingStep.upsert({
      where:  { tenantId },
      create: { tenantId, etape2: true },
      update: { etape2: true },
    }).catch(() => { /* non bloquant */ });
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

  async getDashboard(agenceId: string, tenantId: string) {
    const agency = await this.prisma.agency.findFirst({
      where: { id: agenceId, tenantId },
      select: { id: true, name: true, code: true, city: true, address: true, status: true },
    });
    if (!agency) throw new NotFoundException('Agence non trouvée');

    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const il7Jours  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [kpiTx, agentsRaw, derniersTx, txSemaine] = await Promise.all([
      // KPIs du mois
      this.prisma.transaction.aggregate({
        where: { tenantId, agencyId: agenceId, createdAt: { gte: debutMois }, status: 'COMPLETED' },
        _count: { id: true },
        _sum: { amount: true },
      }),

      // Agents avec float et nb transactions du mois
      this.prisma.agent.findMany({
        where: { agencyId: agenceId, tenantId },
        select: {
          id: true,
          agentCode: true,
          status: true,
          userId: true,
          floatAccounts: { select: { balance: true }, take: 1 },
        },
        orderBy: { createdAt: 'asc' },
      }),

      // 10 dernières transactions
      this.prisma.transaction.findMany({
        where: { tenantId, agencyId: agenceId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          amount: true,
          status: true,
          createdAt: true,
          reference: true,
        },
      }),

      // Transactions par jour sur 7 jours
      this.prisma.transaction.findMany({
        where: { tenantId, agencyId: agenceId, createdAt: { gte: il7Jours }, status: 'COMPLETED' },
        select: { createdAt: true, amount: true },
      }),
    ]);

    // Commissions du mois
    const commissions = await this.prisma.commissionEarning.aggregate({
      where: { tenantId, agencyId: agenceId, createdAt: { gte: debutMois } },
      _sum: { amount: true },
    });

    // Compter les agents actifs
    const agentsActifs = agentsRaw.filter((a) => a.status === 'ACTIVE').length;

    // Résoudre noms utilisateurs
    const userIds = agentsRaw.map((a) => a.userId).filter(Boolean);
    const users   = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Nb tx/mois par agent
    const agentIds = agentsRaw.map((a) => a.id);
    const txParAgent = await this.prisma.transaction.groupBy({
      by: ['agentId'],
      where: { tenantId, agentId: { in: agentIds }, createdAt: { gte: debutMois }, status: 'COMPLETED' },
      _count: { id: true },
      _sum: { amount: true },
    });
    const txAgentMap = new Map(txParAgent.map((r) => [r.agentId!, r]));

    // Évolution 7 jours
    const jourMap = new Map<string, { count: number; volume: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(il7Jours.getTime() + i * 24 * 60 * 60 * 1000);
      jourMap.set(d.toISOString().slice(0, 10), { count: 0, volume: 0 });
    }
    for (const tx of txSemaine) {
      const key = tx.createdAt.toISOString().slice(0, 10);
      const entry = jourMap.get(key);
      if (entry) { entry.count += 1; entry.volume += Number(tx.amount ?? 0); }
    }
    const evolution7Jours = Array.from(jourMap.entries()).map(([date, v]) => ({ date, ...v }));

    return {
      agence: agency,
      kpis: {
        nbTransactions: kpiTx._count.id,
        volume: Number(kpiTx._sum.amount ?? 0),
        commissions: Number(commissions._sum.amount ?? 0),
        agentsActifs,
      },
      evolution7Jours,
      agents: agentsRaw.map((a) => {
        const u  = userMap.get(a.userId);
        const tx = txAgentMap.get(a.id);
        return {
          id: a.id,
          code: a.agentCode,
          nom: u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || a.agentCode : a.agentCode,
          email: u?.email,
          statut: a.status,
          float: Number(a.floatAccounts?.[0]?.balance ?? 0),
          nbTxMois: tx?._count.id ?? 0,
          volumeMois: Number(tx?._sum.amount ?? 0),
        };
      }),
      derniereTransactions: derniersTx,
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
