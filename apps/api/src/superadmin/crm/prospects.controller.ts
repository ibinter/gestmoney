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
import { ProspectsService } from './prospects.service';
import {
  CreateProspectDto,
  UpdateProspectDto,
  ChangerStatutProspectDto,
  ConvertirProspectDto,
} from './dto/prospect.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/enums/role.enum';

@ApiTags('CRM - Prospects')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.SUPER_ADMIN)
@Controller('superadmin/crm/prospects')
export class ProspectsController {
  constructor(private readonly service: ProspectsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les prospects (paginé, filtres, recherche)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('statut') statut?: string,
    @Query('priorite') priorite?: string,
    @Query('origine') origine?: string,
  ) {
    return this.service.findAll({ page, limit, search, statut, priorite, origine });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques du pipeline commercial' })
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter un prospect' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un prospect' })
  create(@Body() dto: CreateProspectDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un prospect' })
  update(@Param('id') id: string, @Body() dto: UpdateProspectDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/statut')
  @ApiOperation({ summary: 'Changer le statut (pipeline) d\'un prospect' })
  changerStatut(@Param('id') id: string, @Body() dto: ChangerStatutProspectDto) {
    return this.service.changerStatut(id, dto.statut);
  }

  @Post(':id/convertir')
  @ApiOperation({ summary: 'Convertir un prospect en offre' })
  convertir(@Param('id') id: string, @Body() dto: ConvertirProspectDto) {
    return this.service.convertir(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un prospect' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
