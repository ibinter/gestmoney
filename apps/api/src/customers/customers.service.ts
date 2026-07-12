import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { LoyaltyRedeemDto } from './dto/loyalty-redeem.dto';
import { v4 as uuidv4 } from 'uuid';

export type LoyaltyLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface CustomerLoyalty {
  points: number;
  level: LoyaltyLevel;
  nextLevel: LoyaltyLevel | null;
  pointsToNextLevel: number | null;
}

export interface ICustomer {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  operatorId?: string;
  agencyId?: string;
  status: string;
  loyaltyPoints: number;
  loyaltyLevel: LoyaltyLevel;
  totalTransactions: number;
  totalMontant: number;
  createdAt: Date;
  updatedAt: Date;
}

// Stockage en mémoire (remplacer par modèle Prisma si disponible)
const inMemoryCustomers: ICustomer[] = [];

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  private mapCustomer(c: any): ICustomer {
    return {
      id: c.id,
      tenantId: c.tenantId,
      firstName: c.firstName ?? '',
      lastName: c.lastName ?? '',
      fullName: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(),
      phone: c.phoneNumber,
      email: c.email,
      address: c.address,
      status: c.status?.toLowerCase() ?? 'actif',
      loyaltyPoints: c.loyaltyPoints ?? 0,
      loyaltyLevel: 'BRONZE' as LoyaltyLevel,
      totalTransactions: c.totalTransactions ?? 0,
      totalMontant: Number(c.totalVolume ?? 0),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      // Champs pour la UI frontend
      prenom: c.firstName ?? '',
      nom: c.lastName ?? '',
      telephone: c.phoneNumber,
      kycStatut: c.kycVerified ? 'verifie' : 'en_attente',
      soldeWallet: Number(c.accounts?.[0]?.balance ?? 0),
      nbTransactions: c.totalTransactions ?? 0,
      montantTotal: Number(c.totalVolume ?? 0),
      ville: c.city ?? '',
      operateur: '',
      statut: c.status === 'ACTIVE' ? 'actif' : c.status === 'BLACKLISTED' ? 'bloque' : 'inactif',
    } as any;
  }

  async create(dto: CreateCustomerDto, tenantId: string): Promise<ICustomer> {
    const existing = await this.prisma.customer.findFirst({
      where: { phoneNumber: dto.phone, tenantId },
    });
    if (existing) throw new BadRequestException(`Un client avec le numéro ${dto.phone} existe déjà`);

    const customer = await this.prisma.customer.create({
      data: {
        tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phone,
        email: dto.email,
        address: dto.address,
        status: 'ACTIVE',
      },
    });

    this.logger.log(`Client créé: ${dto.firstName} ${dto.lastName}`);
    return this.mapCustomer(customer);
  }

  async findAll(
    query: QueryCustomerDto,
    tenantId: string,
  ): Promise<{ data: ICustomer[]; total: number; page: number; limit: number }> {
    const p = Number(query.page) || 1;
    const l = Number(query.limit) || 20;
    const { search, status } = query;

    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status.toUpperCase();

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: (p - 1) * l,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: { accounts: { select: { balance: true }, take: 1 } },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data: customers.map((c) => this.mapCustomer(c)), total, page: p, limit: l };
  }

  async findOne(id: string, tenantId: string): Promise<ICustomer> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: { accounts: { select: { balance: true }, take: 1 } },
    });
    if (!customer) throw new NotFoundException(`Client ${id} introuvable`);
    return this.mapCustomer(customer);
  }

  async update(id: string, dto: Partial<CreateCustomerDto>, tenantId: string): Promise<ICustomer> {
    await this.findOne(id, tenantId);
    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.address !== undefined && { address: dto.address }),
      },
    });
    return this.mapCustomer(updated);
  }

  // ─── Transactions du client ───────────────────────────────────────────────────

  async getCustomerTransactions(
    id: string,
    tenantId: string,
    page = 1,
    limit = 20,
  ) {
    const customer = await this.findOne(id, tenantId);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({ where: { tenantId, agentId: id }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.transaction.count({ where: { tenantId, agentId: id } }),
    ]);

    return { data, total, page, limit };
  }

  // ─── Fidélité ─────────────────────────────────────────────────────────────────

  async getLoyalty(id: string, tenantId: string): Promise<CustomerLoyalty> {
    const customer = await this.findOne(id, tenantId);
    return this.computeLoyalty(customer.loyaltyPoints);
  }

  async redeemPoints(id: string, dto: LoyaltyRedeemDto, tenantId: string): Promise<ICustomer> {
    const customer = await this.findOne(id, tenantId);
    if (customer.loyaltyPoints < dto.points) {
      throw new BadRequestException(
        `Points insuffisants: ${customer.loyaltyPoints} disponibles, ${dto.points} demandés`,
      );
    }
    await this.prisma.customer.update({ where: { id }, data: { loyaltyPoints: { decrement: dto.points } } });
    return this.findOne(id, tenantId);
  }

  async addLoyaltyPoints(customerId: string, tenantId: string, montant: number): Promise<void> {
    try {
      if (pointsGagnes > 0) {
        await this.prisma.customer.update({
          where: { id: customerId },
          data: { loyaltyPoints: { increment: pointsGagnes }, totalTransactions: { increment: 1 } },
        });
      }
    } catch {
      // Client non trouvé — pas d'erreur
    }
  }

  // ─── Recherche ────────────────────────────────────────────────────────────────

  async search(q: string, tenantId: string): Promise<ICustomer[]> {
    const customers = await this.prisma.customer.findMany({
      where: {
        tenantId,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { phoneNumber: { contains: q } },
          { id: q },
        ],
      },
      take: 20,
    });
    return customers.map((c) => this.mapCustomer(c));
  }

  // ─── Statistiques ─────────────────────────────────────────────────────────────

  getStats(tenantId: string) {
    const all = inMemoryCustomers.filter((c) => c.tenantId === tenantId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: all.length,
      actifs: all.filter((c) => c.status === 'ACTIVE').length,
      inactifs: all.filter((c) => c.status === 'INACTIVE').length,
      bloqués: all.filter((c) => c.status === 'BLOCKED').length,
      nouveauxCeMois: all.filter((c) => c.createdAt >= monthStart).length,
      parNiveau: {
        BRONZE: all.filter((c) => c.loyaltyLevel === 'BRONZE').length,
        SILVER: all.filter((c) => c.loyaltyLevel === 'SILVER').length,
        GOLD: all.filter((c) => c.loyaltyLevel === 'GOLD').length,
        PLATINUM: all.filter((c) => c.loyaltyLevel === 'PLATINUM').length,
      },
    };
  }

  // ─── Import CSV ───────────────────────────────────────────────────────────────

  async importFromCSV(
    fileBuffer: Buffer,
    tenantId: string,
  ): Promise<{ imported: number; errors: string[] }> {
    const content = fileBuffer.toString('utf-8');
    const lines = content.split('\n').filter((l) => l.trim());
    const errors: string[] = [];
    let imported = 0;

    // En-tête attendu: firstName,lastName,phone,email,address
    for (let i = 1; i < lines.length; i++) {
      try {
        const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        const [firstName, lastName, phone, email, address] = parts;

        if (!firstName || !lastName || !phone) {
          errors.push(`Ligne ${i + 1}: firstName, lastName et phone sont requis`);
          continue;
        }

        await this.create({ firstName, lastName, phone, email, address }, tenantId);
        imported++;
      } catch (err: any) {
        errors.push(`Ligne ${i + 1}: ${err.message}`);
      }
    }

    return { imported, errors };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private computeLoyalty(points: number): CustomerLoyalty {
    let level: LoyaltyLevel;
    let nextLevel: LoyaltyLevel | null;
    let pointsToNextLevel: number | null;

    if (points >= 20000) {
      level = 'PLATINUM';
      nextLevel = null;
      pointsToNextLevel = null;
    } else if (points >= 5000) {
      level = 'GOLD';
      nextLevel = 'PLATINUM';
      pointsToNextLevel = 20000 - points;
    } else if (points >= 1000) {
      level = 'SILVER';
      nextLevel = 'GOLD';
      pointsToNextLevel = 5000 - points;
    } else {
      level = 'BRONZE';
      nextLevel = 'SILVER';
      pointsToNextLevel = 1000 - points;
    }

    return { points, level, nextLevel, pointsToNextLevel };
  }
}
