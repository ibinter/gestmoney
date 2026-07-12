import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, AssignRoleDto } from './dto/create-role.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { RoleType } from '../common/enums/role.enum';

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les rôles du tenant' })
  findAll(@TenantId() tenantId: string) {
    return this.rolesService.findAll(tenantId);
  }

  @Get('predefined')
  @ApiOperation({ summary: 'Lister les rôles prédéfinis' })
  getPredefined() {
    return this.rolesService.getPredefinedRoles();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un rôle par son ID' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.rolesService.findById(id, tenantId);
  }

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Créer un rôle personnalisé' })
  create(@Body() dto: CreateRoleDto, @TenantId() tenantId: string) {
    return this.rolesService.create(dto, tenantId);
  }

  @Post('assign')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Assigner des rôles à un utilisateur' })
  assignRoles(
    @Body() dto: AssignRoleDto,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.rolesService.assignRoles(dto, tenantId, userId);
  }

  @Post('seed')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Initialiser les rôles par défaut du tenant' })
  seedRoles(@TenantId() tenantId: string) {
    return this.rolesService.seedDefaultRoles(tenantId);
  }
}
