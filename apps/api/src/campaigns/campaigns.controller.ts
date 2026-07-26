import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CreerCampagneDto, PlanifierCampagneDto } from './dto/campaigns.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '../common/enums/role.enum';

@ApiTags('Campagnes Email')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.SUPER_ADMIN)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly service: CampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une campagne email (BROUILLON ou PLANIFIEE)' })
  creer(@Body() dto: CreerCampagneDto, @Request() req: any) {
    const userId: string = req.user?.id ?? 'system';
    return this.service.creerCampagne(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les campagnes (paginé)' })
  lister(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.lister(Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une campagne' })
  trouver(@Param('id') id: string) {
    return this.service.trouver(id);
  }

  @Get(':id/previsualiser')
  @ApiOperation({ summary: 'Prévisualiser les destinataires d\'une campagne' })
  previsualiser(@Param('id') id: string) {
    return this.service.previsualiser(id);
  }

  @Post(':id/envoyer')
  @ApiOperation({ summary: 'Envoyer la campagne immédiatement' })
  envoyer(@Param('id') id: string) {
    return this.service.envoyer(id);
  }

  @Post(':id/planifier')
  @ApiOperation({ summary: 'Planifier l\'envoi pour une date future' })
  planifier(@Param('id') id: string, @Body() dto: PlanifierCampagneDto) {
    return this.service.planifier(id, new Date(dto.date));
  }
}
