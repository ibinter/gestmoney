import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, tenantId: string, createdBy: string) {
    const { email, password, roles, ...rest } = createUserDto;

    const existing = await this.prisma.user.findFirst({
      where: { email, tenantId },
    });
    if (existing) throw new ConflictException('Email déjà utilisé dans ce tenant');

    const passwordHash = await bcrypt.hash(password, 12);

    const roleRecords = roles
      ? await this.prisma.role.findMany({ where: { name: { in: roles }, tenantId } })
      : [];

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        tenantId,
        status: 'ACTIVE',
        firstName: rest.firstName,
        lastName: rest.lastName,
        phone: rest.phone,
        ...(roleRecords.length > 0 && {
          userRoles: {
            create: roleRecords.map((r) => ({ roleId: r.id })),
          },
        }),
      },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    await this.logAudit('CREATE', createdBy, tenantId, { targetUserId: user.id, email });

    const { passwordHash: _, ...safeUser } = user;
    return { ...safeUser, roles: user.userRoles.map((ur) => ur.role.name) };
  }

  async findAll(query: QueryUserDto, tenantId: string) {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      agencyId,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.status = isActive ? 'ACTIVE' : { in: ['INACTIVE', 'SUSPENDED'] };
    }

    if (role) {
      where.userRoles = { some: { role: { name: role } } };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { userRoles: { include: { role: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map(({ passwordHash, twoFactorSecret, ...u }) => ({
      ...u,
      roles: u.userRoles.map((ur) => ur.role.name),
    }));

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const { passwordHash, twoFactorSecret, ...safeUser } = user;
    return { ...safeUser, roles: user.userRoles.map((ur) => ur.role.name) };
  }

  async update(id: string, tenantId: string, dto: UpdateUserDto, updatedBy: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const { roles, isActive, ...rest } = dto;

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(isActive !== undefined && {
          status: isActive ? 'ACTIVE' : 'INACTIVE',
        }),
      },
      include: { userRoles: { include: { role: true } } },
    });

    if (roles && roles.length > 0) {
      const roleRecords = await this.prisma.role.findMany({
        where: { name: { in: roles }, tenantId },
      });
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      await this.prisma.userRole.createMany({
        data: roleRecords.map((r) => ({ userId: id, roleId: r.id })),
      });
    }

    await this.logAudit('UPDATE', updatedBy, tenantId, { targetUserId: id });

    const { passwordHash, twoFactorSecret, ...safeUser } = updated;
    return { ...safeUser, roles: updated.userRoles.map((ur) => ur.role.name) };
  }

  async remove(id: string, tenantId: string, deletedBy: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    await this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    await this.logAudit('DELETE', deletedBy, tenantId, { targetUserId: id });
    return { message: 'Utilisateur désactivé avec succès' };
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
          resource: 'users',
          description: JSON.stringify(details),
        },
      });
    } catch (e) {
      this.logger.warn(`AuditLog erreur: ${e.message}`);
    }
  }
}
