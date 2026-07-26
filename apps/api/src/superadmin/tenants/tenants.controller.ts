import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { TenantsAdminService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/enums/role.enum';

/**
 * Console SuperAdmin — Gestion complète des tenants.
 * Toutes les routes sont réservées au SUPER_ADMIN.
 */
@ApiTags('SuperAdmin Tenants')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.SUPER_ADMIN)
@Controller('superadmin')
export class TenantsAdminController {
  constructor(private readonly service: TenantsAdminService) {}

  /** 6 KPIs globaux de la plateforme */
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques globales de la plateforme' })
  statsGlobales() {
    return this.service.statsGlobales();
  }

  /** Liste paginée des tenants avec filtres */
  @Get('tenants')
  @ApiOperation({ summary: 'Liste paginée des tenants' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'statut', required: false, type: String, description: 'ACTIVE | SUSPENDED | TRIAL | EXPIRED' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche par nom ou slug' })
  listerTenants(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('statut') statut?: string,
    @Query('search') search?: string,
  ) {
    return this.service.listerTenants({ page, limit, statut, search });
  }

  /** Vue détaillée d'un tenant */
  @Get('tenants/:id')
  @ApiOperation({ summary: 'Détail complet d\'un tenant : stats + transactions + users' })
  @ApiParam({ name: 'id', type: String })
  getDetailTenant(@Param('id') id: string) {
    return this.service.getDetailTenant(id);
  }

  /** Suspendre un tenant */
  @Patch('tenants/:id/suspendre')
  @ApiOperation({ summary: 'Suspendre l\'accès d\'un tenant' })
  @ApiParam({ name: 'id', type: String })
  suspendre(
    @Param('id') id: string,
    @Body() body: { raison?: string },
  ) {
    return this.service.suspendreOuReactiver(id, 'SUSPENDRE', body.raison ?? 'Suspendu par le SuperAdmin');
  }

  /** Réactiver un tenant suspendu */
  @Patch('tenants/:id/reactiver')
  @ApiOperation({ summary: 'Réactiver un tenant suspendu' })
  @ApiParam({ name: 'id', type: String })
  reactiver(
    @Param('id') id: string,
    @Body() body: { raison?: string },
  ) {
    return this.service.suspendreOuReactiver(id, 'REACTIVER', body.raison ?? 'Réactivé par le SuperAdmin');
  }

  /** Prolonger la licence d'un tenant */
  @Patch('tenants/:id/licence')
  @ApiOperation({ summary: 'Prolonger la licence d\'un tenant de N jours' })
  @ApiParam({ name: 'id', type: String })
  prolongerLicence(
    @Param('id') id: string,
    @Body() body: { jours: number },
  ) {
    return this.service.prolongerLicence(id, Number(body.jours));
  }

  /** Envoyer un lien de reset de mot de passe à l'admin principal du tenant */
  @Post('tenants/:id/reset-admin')
  @ApiOperation({ summary: 'Envoyer un lien de reset de mot de passe à l\'admin du tenant' })
  @ApiParam({ name: 'id', type: String })
  resetPasswordAdmin(@Param('id') id: string) {
    return this.service.resetPasswordAdmin(id);
  }
}
