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
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { RoleType } from '../common/enums/role.enum';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Créer un utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé' })
  create(
    @Body() dto: CreateUserDto,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.create(dto, tenantId, userId);
  }

  @Get()
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER, RoleType.AUDITOR)
  @ApiOperation({ summary: 'Lister les utilisateurs avec pagination et filtres' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs' })
  findAll(@Query() query: QueryUserDto, @TenantId() tenantId: string) {
    return this.usersService.findAll(query, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un utilisateur par son ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur trouvé' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.usersService.findById(id, tenantId);
  }

  @Patch(':id')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Modifier un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.update(id, tenantId, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Désactiver un utilisateur (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.remove(id, tenantId, userId);
  }
}
