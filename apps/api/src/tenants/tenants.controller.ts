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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/create-tenant.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleType } from '../common/enums/role.enum';

@ApiTags('Tenants')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.SUPER_ADMIN)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau tenant (SUPER_ADMIN uniquement)' })
  @ApiResponse({ status: 201, description: 'Tenant créé' })
  create(@Body() dto: CreateTenantDto, @CurrentUser('id') userId: string) {
    return this.tenantsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les tenants' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.tenantsService.findAll(page, limit, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un tenant par son ID' })
  @ApiParam({ name: 'id', description: 'ID du tenant' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier la configuration d\'un tenant' })
  @ApiParam({ name: 'id', description: 'ID du tenant' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.tenantsService.update(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Désactiver un tenant' })
  @ApiParam({ name: 'id', description: 'ID du tenant' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tenantsService.deactivate(id, userId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Statistiques d\'un tenant' })
  @ApiParam({ name: 'id', description: 'ID du tenant' })
  getStats(@Param('id') id: string) {
    return this.tenantsService.getStats(id);
  }
}
