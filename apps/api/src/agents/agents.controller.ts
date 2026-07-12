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
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { QueryAgentDto } from './dto/query-agent.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { RoleType } from '../common/enums/role.enum';
import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class SuspendAgentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

@ApiTags('Agents')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Créer un agent Mobile Money' })
  @ApiResponse({ status: 201, description: 'Agent créé' })
  create(
    @Body() dto: CreateAgentDto,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.agentsService.create(dto, tenantId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les agents avec filtres' })
  @ApiResponse({ status: 200, description: 'Liste des agents' })
  findAll(@Query() query: QueryAgentDto, @TenantId() tenantId: string) {
    return this.agentsService.findAll(query, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un agent par son ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'agent' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.agentsService.findById(id, tenantId);
  }

  @Patch(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Modifier un agent' })
  @ApiParam({ name: 'id', description: 'ID de l\'agent' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.agentsService.update(id, tenantId, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Désactiver un agent' })
  @ApiParam({ name: 'id', description: 'ID de l\'agent' })
  remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.agentsService.remove(id, tenantId, userId);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Obtenir les transactions d\'un agent' })
  @ApiParam({ name: 'id', description: 'ID de l\'agent' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTransactions(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.agentsService.getTransactions(id, tenantId, page, limit);
  }

  @Get(':id/commissions')
  @ApiOperation({ summary: 'Obtenir les commissions d\'un agent' })
  @ApiParam({ name: 'id', description: 'ID de l\'agent' })
  getCommissions(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.agentsService.getCommissions(id, tenantId, page, limit);
  }

  @Get(':id/float')
  @ApiOperation({ summary: 'Obtenir le float d\'un agent' })
  @ApiParam({ name: 'id', description: 'ID de l\'agent' })
  getFloat(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.agentsService.getFloat(id, tenantId);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Suspendre un agent' })
  @ApiParam({ name: 'id', description: 'ID de l\'agent' })
  suspend(
    @Param('id') id: string,
    @Body() dto: SuspendAgentDto,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.agentsService.suspend(id, tenantId, dto.reason || 'Raison non spécifiée', userId);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Réactiver un agent suspendu' })
  @ApiParam({ name: 'id', description: 'ID de l\'agent' })
  activate(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.agentsService.activate(id, tenantId, userId);
  }
}
