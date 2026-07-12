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
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { RoleType } from '../common/enums/role.enum';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class AssignAgentDto {
  @ApiProperty()
  @IsString()
  agentId: string;
}

@ApiTags('Agencies')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Créer une agence' })
  create(
    @Body() dto: CreateAgencyDto,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.agenciesService.create(dto, tenantId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les agences' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'networkId', required: false, type: String })
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('networkId') networkId?: string,
  ) {
    return this.agenciesService.findAll(tenantId, page, limit, search, networkId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une agence par son ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'agence' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.agenciesService.findById(id, tenantId);
  }

  @Patch(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Modifier une agence' })
  @ApiParam({ name: 'id', description: 'ID de l\'agence' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAgencyDto,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.agenciesService.update(id, tenantId, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Désactiver une agence' })
  @ApiParam({ name: 'id', description: 'ID de l\'agence' })
  remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.agenciesService.remove(id, tenantId, userId);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Statistiques d\'une agence (nb agents, float total...)' })
  @ApiParam({ name: 'id', description: 'ID de l\'agence' })
  getStatistics(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.agenciesService.getStatistics(id, tenantId);
  }

  @Post(':id/agents/assign')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Assigner un agent à cette agence' })
  @ApiParam({ name: 'id', description: 'ID de l\'agence' })
  assignAgent(
    @Param('id') agencyId: string,
    @Body() dto: AssignAgentDto,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.agenciesService.assignAgent(agencyId, dto.agentId, tenantId, userId);
  }
}
