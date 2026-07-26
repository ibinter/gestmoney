import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { KycDossierService } from './kyc-dossier.service';
import {
  SoumettreDocumentsDto,
  ValiderDossierDto,
  RefuserDossierDto,
  QueryKycDossiersDto,
} from './dto/kyc-dossier.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('kyc-dossiers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('kyc-dossiers')
export class KycDossierController {
  constructor(private readonly service: KycDossierService) {}

  /** Liste tous les dossiers KYC (ADMIN / MANAGER) */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Liste paginée des dossiers KYC avec filtre statut' })
  @ApiQuery({ name: 'statut', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listerDossiers(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryKycDossiersDto,
  ) {
    return this.service.listerDossiers(user.tenantId, query);
  }

  /** Statistiques par statut */
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Statistiques KYC par statut' })
  statsKyc(@CurrentUser() user: JwtPayload) {
    return this.service.statsKyc(user.tenantId);
  }

  /** Dossier KYC d'un client specifique */
  @Get('client/:clientId')
  @ApiOperation({ summary: "Dossier KYC d'un client" })
  @ApiParam({ name: 'clientId' })
  getDossier(
    @Param('clientId') clientId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.getDossier(clientId, user.tenantId);
  }

  /** Soumettre ou mettre a jour les documents d'un client */
  @Post('client/:clientId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Soumettre / mettre a jour le dossier KYC d'un client" })
  @ApiParam({ name: 'clientId' })
  soumettreDocuments(
    @Param('clientId') clientId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SoumettreDocumentsDto,
  ) {
    return this.service.soumettreDocuments(clientId, user.tenantId, dto);
  }

  /** Valider un dossier (ADMIN seulement) */
  @Patch(':id/valider')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Valider un dossier KYC' })
  @ApiParam({ name: 'id' })
  valider(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ValiderDossierDto,
  ) {
    return this.service.valider(id, user.sub, dto);
  }

  /** Refuser un dossier (ADMIN seulement, commentaire obligatoire) */
  @Patch(':id/refuser')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Refuser un dossier KYC avec raison obligatoire' })
  @ApiParam({ name: 'id' })
  refuser(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RefuserDossierDto,
  ) {
    return this.service.refuser(id, user.sub, dto);
  }
}
