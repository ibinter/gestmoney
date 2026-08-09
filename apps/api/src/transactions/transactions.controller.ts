import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AgencyScopeGuard } from '../common/guards/agency-scope.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '../common/enums/role.enum';
import { JwtOrApiKeyGuard, RequirePermission } from '../api-keys/guards/jwt-or-apikey.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { TransactionStatsQueryDto } from './dto/transaction-stats.dto';
import { TransactionsService } from './transactions.service';
import { PdfService } from '../pdf/pdf.service';
import { LicencesService } from '../licences/licences.service';
import { StatutLicence } from '../licences/dto/licences.dto';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtOrApiKeyGuard, AgencyScopeGuard, RolesGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly pdfService: PdfService,
    private readonly licences: LicencesService,
  ) {}

  /**
   * §3.3 cahier : l'export de données est FERMÉ au palier gratuit Découverte.
   * Bloque UNIQUEMENT le statut DECOUVERTE (403) ; ACTIVE/TRIAL/GRACE/PROVISOIRE/
   * SUPER_ADMIN restent pleinement fonctionnels.
   */
  private async assurerExportAutorise(tenantId: string): Promise<void> {
    const { statut } = await this.licences.getStatutLicenceCache(tenantId);
    if (statut === StatutLicence.DECOUVERTE) {
      throw new ForbiddenException({
        code: 'EXPORT_INDISPONIBLE_DECOUVERTE',
        message:
          "L'export n'est pas disponible au palier Découverte. Passez à une formule payante pour l'activer.",
      });
    }
  }

  @Post()
  @RequirePermission('transactions:write')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER, RoleType.AGENT)
  @ApiOperation({ summary: 'Créer une nouvelle transaction' })
  @ApiResponse({ status: 201, description: 'Transaction créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou float insuffisant' })
  @ApiResponse({ status: 403, description: 'Agent suspendu' })
  @ApiResponse({ status: 403, description: 'Plafond du palier Découverte atteint (code QUOTA_DECOUVERTE_ATTEINT).' })
  create(@Body() dto: CreateTransactionDto, @Req() req: any) {
    const tenantId: string = req.user.tenantId;
    const userId: string = req.user.id;
    // agenceId enrichi par AgencyScopeGuard pour AGENCY_MANAGER/AGENT
    return this.transactionsService.create(dto, tenantId, userId, req.user.agenceId);
  }

  @Get()
  @RequirePermission('transactions:read')
  @ApiOperation({ summary: 'Lister les transactions avec filtres avancés' })
  @ApiResponse({ status: 200, description: 'Liste paginée des transactions' })
  findAll(@Query() query: QueryTransactionDto, @Req() req: any) {
    // agenceId enrichi par AgencyScopeGuard — null pour les admins (pas de scope)
    return this.transactionsService.findAll(query, req.user.tenantId, req.user.agenceId);
  }

  @Get('stats/today')
  @ApiOperation({ summary: "Statistiques du jour" })
  @ApiResponse({ status: 200, description: 'Stats agrégées du jour en cours' })
  getStatsToday(@Req() req: any) {
    return this.transactionsService.getStatsToday(req.user.tenantId);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Résumé statistique sur une période' })
  @ApiResponse({ status: 200, description: 'Résumé avec top agents et agrégats par type' })
  getSummary(@Query() query: TransactionStatsQueryDto, @Req() req: any) {
    return this.transactionsService.getSummary(query, req.user.tenantId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exporter les transactions en CSV' })
  @ApiResponse({ status: 200, description: 'Fichier CSV' })
  async exportCsv(
    @Query() query: QueryTransactionDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    await this.assurerExportAutorise(req.user.tenantId);
    const csv = await this.transactionsService.exportCsv(query, req.user.tenantId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="transactions-${Date.now()}.csv"`,
    );
    res.send(csv);
  }

  @Post('bulk-import')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Importer des transactions depuis un fichier CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Résultat de l\'import' })
  @UseInterceptors(FileInterceptor('file'))
  bulkImport(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.transactionsService.bulkImport(file, req.user.tenantId, req.user.id);
  }

  @Get(':id/recu')
  @ApiOperation({ summary: 'Générer et télécharger le reçu PDF d\'une transaction' })
  @ApiParam({ name: 'id', description: 'ID de la transaction (UUID)' })
  @ApiResponse({ status: 200, description: 'Reçu PDF de la transaction' })
  @ApiResponse({ status: 404, description: 'Transaction introuvable' })
  async downloadRecu(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const tenantId: string = req.user.tenantId;
    const pdfBuffer = await this.pdfService.genererRecuTransaction(id, tenantId);
    // Récupérer la référence pour le nom du fichier
    const tx = await this.transactionsService.findOne(id, tenantId);
    const reference = (tx as any).reference ?? id;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="recu-${reference}.html"`);
    res.send(pdfBuffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une transaction' })
  @ApiParam({ name: 'id', description: 'ID de la transaction (UUID)' })
  @ApiResponse({ status: 200, description: 'Détail de la transaction' })
  @ApiResponse({ status: 404, description: 'Transaction introuvable' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.transactionsService.findOne(id, req.user.tenantId);
  }

  @Post(':id/complete')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER, RoleType.AGENT)
  @ApiOperation({ summary: 'Valider (compléter) une transaction en attente' })
  @ApiParam({ name: 'id', description: 'ID de la transaction' })
  @ApiResponse({ status: 201, description: 'Transaction complétée (commission calculée)' })
  @ApiResponse({ status: 400, description: 'Transaction non complétable (statut incompatible)' })
  complete(@Param('id') id: string, @Req() req: any) {
    return this.transactionsService.complete(id, req.user.tenantId, req.user.id);
  }

  @Post(':id/cancel')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN, RoleType.AGENCY_MANAGER)
  @ApiOperation({ summary: 'Annuler une transaction en attente' })
  @ApiParam({ name: 'id', description: 'ID de la transaction' })
  @ApiResponse({ status: 200, description: 'Transaction annulée' })
  @ApiResponse({ status: 400, description: 'Transaction non annulable (statut incompatible)' })
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.transactionsService.cancel(id, req.user.tenantId, req.user.id);
  }

  @Post(':id/reverse')
  @Roles(RoleType.SUPER_ADMIN, RoleType.NETWORK_ADMIN)
  @ApiOperation({ summary: 'Reverser une transaction complétée' })
  @ApiParam({ name: 'id', description: 'ID de la transaction' })
  @ApiResponse({ status: 200, description: 'Transaction reversée' })
  @ApiResponse({ status: 400, description: 'Transaction non reversible' })
  reverse(@Param('id') id: string, @Req() req: any) {
    return this.transactionsService.reverse(id, req.user.tenantId, req.user.id);
  }
}
