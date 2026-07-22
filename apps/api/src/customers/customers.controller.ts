import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { LoyaltyRedeemDto } from './dto/loyalty-redeem.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '../common/enums/role.enum';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { SoumettreKycDto, RejeterKycDto } from './dto/kyc.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('search')
  @ApiOperation({ summary: 'Recherche rapide par nom, téléphone, ID' })
  @ApiQuery({ name: 'q', required: true, description: 'Terme de recherche' })
  search(@Query('q') q: string, @CurrentUser() user: CurrentUserData) {
    return this.customersService.search(q, user.tenantId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques clients (nouveaux, actifs, inactifs)' })
  getStats(@CurrentUser() user: CurrentUserData) {
    return this.customersService.getStats(user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des clients avec filtres et pagination' })
  findAll(@Query() query: QueryCustomerDto, @CurrentUser() user: CurrentUserData) {
    return this.customersService.findAll(query, user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Enregistrer un nouveau client' })
  @ApiResponse({ status: 201, description: 'Client créé' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCustomerDto, @CurrentUser() user: CurrentUserData) {
    return this.customersService.create(dto, user.tenantId);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import CSV de clients' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file'))
  importCSV(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.customersService.importFromCSV(file.buffer, user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Profil complet d\'un client' })
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.customersService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un client' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.customersService.update(id, dto, user.tenantId);
  }

  // ─── KYC ─────────────────────────────────────────────────────────────────────

  @Patch(':id/kyc/submit')
  @ApiOperation({ summary: "Soumettre / déposer le dossier KYC d'un client (→ en attente)" })
  soumettreKyc(
    @Param('id') id: string,
    @Body() dto: SoumettreKycDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.customersService.soumettreKyc(id, user.tenantId, dto);
  }

  @Patch(':id/kyc/approve')
  @UseGuards(RolesGuard)
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Approuver le KYC (admin) → vérifié' })
  approuverKyc(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.customersService.approuverKyc(id, user.tenantId);
  }

  @Patch(':id/kyc/reject')
  @UseGuards(RolesGuard)
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Rejeter le KYC (admin) → rejeté + motif' })
  rejeterKyc(
    @Param('id') id: string,
    @Body() dto: RejeterKycDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.customersService.rejeterKyc(id, user.tenantId, dto.reason);
  }

  @Get(':id/kyc/document')
  @ApiOperation({ summary: 'Récupérer le document KYC (data URL base64)' })
  getKycDocument(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.customersService.getKycDocument(id, user.tenantId);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Historique des transactions d\'un client' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTransactions(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: CurrentUserData,
  ) {
    return this.customersService.getCustomerTransactions(id, user!.tenantId, page, limit);
  }

  @Get(':id/loyalty')
  @ApiOperation({ summary: 'Points fidélité et niveau du client' })
  getLoyalty(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.customersService.getLoyalty(id, user.tenantId);
  }

  @Post(':id/loyalty/redeem')
  @ApiOperation({ summary: 'Utiliser des points fidélité' })
  redeemPoints(
    @Param('id') id: string,
    @Body() dto: LoyaltyRedeemDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.customersService.redeemPoints(id, dto, user.tenantId);
  }
}
