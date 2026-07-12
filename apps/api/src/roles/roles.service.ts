import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, AssignRoleDto } from './dto/create-role.dto';
import { RoleType } from '../common/enums/role.enum';

// Rôles prédéfinis GESTMONEY
const PREDEFINED_ROLES = [
  {
    name: RoleType.SUPER_ADMIN,
    description: 'Super administrateur avec accès complet à toute la plateforme',
    permissions: [{ resource: '*', action: '*' }],
  },
  {
    name: RoleType.NETWORK_ADMIN,
    description: 'Administrateur du réseau Mobile Money',
    permissions: [
      { resource: 'network', action: '*' },
      { resource: 'agents', action: '*' },
      { resource: 'agencies', action: '*' },
      { resource: 'transactions', action: '*' },
      { resource: 'reports', action: 'read' },
      { resource: 'float', action: '*' },
    ],
  },
  {
    name: RoleType.AGENCY_MANAGER,
    description: 'Responsable d\'agence Mobile Money',
    permissions: [
      { resource: 'agency', action: 'manage' },
      { resource: 'agents', action: 'manage' },
      { resource: 'transactions', action: 'read' },
      { resource: 'reports', action: 'read' },
      { resource: 'float', action: 'read' },
    ],
  },
  {
    name: RoleType.AGENT,
    description: 'Agent de terrain Mobile Money',
    permissions: [
      { resource: 'transactions', action: 'create' },
      { resource: 'transactions', action: 'read' },
      { resource: 'float', action: 'read' },
      { resource: 'commissions', action: 'read' },
    ],
  },
  {
    name: RoleType.ACCOUNTANT,
    description: 'Comptable (accès lectures financières)',
    permissions: [
      { resource: 'transactions', action: 'read' },
      { resource: 'reports', action: 'read' },
      { resource: 'commissions', action: 'read' },
      { resource: 'reconciliation', action: '*' },
      { resource: 'accounting', action: '*' },
    ],
  },
  {
    name: RoleType.AUDITOR,
    description: 'Auditeur (lecture seule totale)',
    permissions: [
      { resource: '*', action: 'read' },
      { resource: 'audit', action: 'read' },
    ],
  },
  {
    name: RoleType.VIEWER,
    description: 'Observateur (tableau de bord uniquement)',
    permissions: [
      { resource: 'dashboard', action: 'read' },
    ],
  },
];

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private prisma: PrismaService) {}

  async seedDefaultRoles(tenantId: string) {
    const existingRoles = await this.prisma.role.findMany({ where: { tenantId } });
    const existingNames = new Set(existingRoles.map((r) => r.name));

    for (const roleDef of PREDEFINED_ROLES) {
      if (!existingNames.has(roleDef.name)) {
        const role = await this.prisma.role.create({
          data: {
            name: roleDef.name,
            description: roleDef.description,
            tenantId,
            isSystem: true,
          },
        });

        // Créer les permissions et les lier
        for (const perm of roleDef.permissions) {
          let permission = await this.prisma.permission.findFirst({
            where: { resource: perm.resource, action: perm.action },
          });

          if (!permission) {
            permission = await this.prisma.permission.create({
              data: { resource: perm.resource, action: perm.action },
            });
          }

          await this.prisma.rolePermission.create({
            data: { roleId: role.id, permissionId: permission.id },
          }).catch(() => {}); // Ignorer si déjà existant
        }

        this.logger.log(`Rôle initialisé: ${roleDef.name} [tenant:${tenantId}]`);
      }
    }

    return { message: 'Rôles par défaut initialisés', count: PREDEFINED_ROLES.length };
  }

  async findAll(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      include: {
        _count: { select: { userRoles: true } },
        rolePerms: { include: { permission: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, tenantId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId },
      include: {
        userRoles: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        rolePerms: { include: { permission: true } },
      },
    });
    if (!role) throw new NotFoundException('Rôle non trouvé');
    return role;
  }

  async create(dto: CreateRoleDto, tenantId: string) {
    const existing = await this.prisma.role.findFirst({
      where: { name: dto.name, tenantId },
    });
    if (existing) throw new ConflictException('Ce rôle existe déjà dans ce tenant');

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        tenantId,
        isSystem: false,
      },
    });

    return role;
  }

  async assignRoles(dto: AssignRoleDto, tenantId: string, assignedBy: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, tenantId },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const roles = await this.prisma.role.findMany({
      where: { name: { in: dto.roles }, tenantId },
    });

    // Supprimer anciens rôles et réassigner
    await this.prisma.userRole.deleteMany({ where: { userId: dto.userId } });
    if (roles.length > 0) {
      await this.prisma.userRole.createMany({
        data: roles.map((r) => ({
          userId: dto.userId,
          roleId: r.id,
          grantedBy: assignedBy,
        })),
        skipDuplicates: true,
      });
    }

    return { message: 'Rôles assignés avec succès', roles: roles.map((r) => r.name) };
  }

  getPredefinedRoles() {
    return PREDEFINED_ROLES.map(({ name, description, permissions }) => ({
      name,
      description,
      permissions: permissions.map((p) => `${p.resource}:${p.action}`),
    }));
  }
}
