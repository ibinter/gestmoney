import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '../common/enums/role.enum';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @Roles(RoleType.NETWORK_ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Générer une nouvelle clé API (retournée UNE SEULE FOIS)' })
  @ApiResponse({ status: 201, description: 'Clé API générée' })
  create(@Body() dto: CreateApiKeyDto, @Req() req: any) {
    return this.apiKeysService.generer(req.user.tenantId, req.user.id, dto);
  }

  @Get()
  @Roles(RoleType.NETWORK_ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Lister les clés API du tenant (sans les valeurs en clair)' })
  findAll(@Req() req: any) {
    return this.apiKeysService.lister(req.user.tenantId);
  }

  @Delete(':id')
  @Roles(RoleType.NETWORK_ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Révoquer une clé API' })
  @ApiResponse({ status: 200, description: 'Clé révoquée' })
  revoke(@Param('id') id: string, @Req() req: any) {
    return this.apiKeysService.revoquer(id, req.user.tenantId);
  }
}
