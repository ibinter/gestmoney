import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OffresService } from './offres.service';
import {
  CreateOffreDto,
  UpdateOffreDto,
  ChangerStatutOffreDto,
} from './dto/offre.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/enums/role.enum';

@ApiTags('CRM - Offres')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.SUPER_ADMIN)
@Controller('superadmin/crm/offres')
export class OffresController {
  constructor(private readonly service: OffresService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les offres (paginé, filtres, recherche)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('statut') statut?: string,
  ) {
    return this.service.findAll({ page, limit, search, statut });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des offres (pipeline financier)' })
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter une offre' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une offre' })
  create(@Body() dto: CreateOffreDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une offre' })
  update(@Param('id') id: string, @Body() dto: UpdateOffreDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/statut')
  @ApiOperation({ summary: 'Changer le statut d\'une offre' })
  changerStatut(@Param('id') id: string, @Body() dto: ChangerStatutOffreDto) {
    return this.service.changerStatut(id, dto.statut);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une offre' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
