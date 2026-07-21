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
import { DemonstrationsService } from './demonstrations.service';
import {
  CreateDemonstrationDto,
  UpdateDemonstrationDto,
  ChangerStatutDemoDto,
} from './dto/demonstration.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleType } from '../../common/enums/role.enum';

@ApiTags('CRM - Démonstrations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.SUPER_ADMIN)
@Controller('superadmin/crm/demonstrations')
export class DemonstrationsController {
  constructor(private readonly service: DemonstrationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les démonstrations (paginé, filtres, recherche)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('statut') statut?: string,
    @Query('mode') mode?: string,
  ) {
    return this.service.findAll({ page, limit, search, statut, mode });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des démonstrations' })
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter une démonstration' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Planifier une démonstration' })
  create(@Body() dto: CreateDemonstrationDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une démonstration' })
  update(@Param('id') id: string, @Body() dto: UpdateDemonstrationDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/statut')
  @ApiOperation({ summary: 'Changer le statut d\'une démonstration' })
  changerStatut(@Param('id') id: string, @Body() dto: ChangerStatutDemoDto) {
    return this.service.changerStatut(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une démonstration' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
