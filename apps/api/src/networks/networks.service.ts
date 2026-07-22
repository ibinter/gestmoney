import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNetworkDto, UpdateNetworkDto } from './dto/network.dto';

/**
 * CRUD des opérateurs Mobile Money (modèle Network) — scopé au tenant.
 * La suppression est refusée si l'opérateur est référencé (transactions,
 * agences, comptes float, grilles, comptes clients) : désactiver à la place.
 */
@Injectable()
export class NetworksService {
  private readonly logger = new Logger(NetworksService.name);

  constructor(private readonly prisma: PrismaService) {}

  private toDto(n: any) {
    return {
      id: n.id,
      operatorCode: n.operatorCode,
      name: n.name,
      country: n.country,
      currency: n.currency,
      status: n.status,
      nbTransactions: n._count?.transactions ?? 0,
      nbAgences: n._count?.agencies ?? 0,
      nbFloat: n._count?.floatAccounts ?? 0,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    };
  }

  async list(tenantId: string) {
    const rows = await this.prisma.network.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { transactions: true, agencies: true, floatAccounts: true },
        },
      },
    });
    return rows.map((n) => this.toDto(n));
  }

  async getOne(id: string, tenantId: string) {
    const n = await this.prisma.network.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { transactions: true, agencies: true, floatAccounts: true },
        },
      },
    });
    if (!n) throw new NotFoundException('Opérateur introuvable');
    return this.toDto(n);
  }

  private async assurerCodeLibre(
    tenantId: string,
    operatorCode: string,
    exclureId?: string,
  ) {
    const existe = await this.prisma.network.findUnique({
      where: { tenantId_operatorCode: { tenantId, operatorCode } },
    });
    if (existe && existe.id !== exclureId) {
      throw new ConflictException(
        `Un opérateur avec le code « ${operatorCode} » existe déjà.`,
      );
    }
  }

  async create(tenantId: string, dto: CreateNetworkDto) {
    await this.assurerCodeLibre(tenantId, dto.operatorCode);
    const n = await this.prisma.network.create({
      data: {
        tenantId,
        operatorCode: dto.operatorCode,
        name: dto.name,
        country: dto.country,
        currency: dto.currency ?? 'XOF',
        status: dto.status ?? 'ACTIVE',
      },
    });
    this.logger.log(`Opérateur créé : ${n.operatorCode} (${tenantId})`);
    return this.getOne(n.id, tenantId);
  }

  async update(id: string, tenantId: string, dto: UpdateNetworkDto) {
    const n = await this.prisma.network.findFirst({ where: { id, tenantId } });
    if (!n) throw new NotFoundException('Opérateur introuvable');

    if (dto.operatorCode && dto.operatorCode !== n.operatorCode) {
      await this.assurerCodeLibre(tenantId, dto.operatorCode, id);
    }

    await this.prisma.network.update({
      where: { id },
      data: {
        operatorCode: dto.operatorCode,
        name: dto.name,
        country: dto.country,
        currency: dto.currency,
        status: dto.status,
      },
    });
    return this.getOne(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    const n = await this.prisma.network.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            transactions: true,
            agencies: true,
            floatAccounts: true,
            commissionPlans: true,
            customerAccounts: true,
          },
        },
      },
    });
    if (!n) throw new NotFoundException('Opérateur introuvable');

    const c: any = n._count;
    const refs =
      c.transactions +
      c.agencies +
      c.floatAccounts +
      c.commissionPlans +
      c.customerAccounts;
    if (refs > 0) {
      throw new ConflictException(
        `Suppression impossible : opérateur utilisé (${c.transactions} transaction(s), ${c.agencies} agence(s), ${c.floatAccounts} compte(s) float, ${c.commissionPlans} grille(s), ${c.customerAccounts} compte(s) client). Désactivez-le plutôt.`,
      );
    }

    await this.prisma.network.delete({ where: { id } });
    this.logger.log(`Opérateur supprimé : ${n.operatorCode} (${tenantId})`);
    return { deleted: true };
  }
}
