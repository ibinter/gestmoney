import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '../common/enums/role.enum';
import { NetworksService } from './networks.service';
import { CreateNetworkDto, UpdateNetworkDto } from './dto/network.dto';

/**
 * Gestion des opérateurs Mobile Money (Network). Lecture ouverte à tout
 * utilisateur authentifié ; création/modification/suppression réservées aux
 * administrateurs (SUPER_ADMIN / NETWORK_ADMIN).
 */
@ApiTags('Opérateurs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('networks')
export class NetworksController {
  constructor(private readonly networksService: NetworksService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les opérateurs' })
  list(@Req() req: any) {
    return this.networksService.list(req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un opérateur' })
  getOne(@Param('id') id: string, @Req() req: any) {
    return this.networksService.getOne(id, req.user.tenantId);
  }

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Créer un opérateur' })
  create(@Body() dto: CreateNetworkDto, @Req() req: any) {
    return this.networksService.create(req.user.tenantId, dto);
  }

  @Patch(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Modifier un opérateur' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNetworkDto,
    @Req() req: any,
  ) {
    return this.networksService.update(id, req.user.tenantId, dto);
  }

  @Delete(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Supprimer un opérateur (si non référencé)' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.networksService.remove(id, req.user.tenantId);
  }
}
