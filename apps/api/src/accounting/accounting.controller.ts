import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { CreateJournalEntryDto } from './dto/journal-entry.dto';
import { QueryLedgerDto } from './dto/query-ledger.dto';
import { CreateFiscalYearDto, CloseFiscalYearDto } from './dto/fiscal-year.dto';
import { ReconcileDto, CreateChartOfAccountDto, AutoEntryDto } from './dto/reconcile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

// Ce contrôleur n'avait AUCUNE garde : les endpoints comptables étaient
// exposés sans authentification, et comme chaque handler lit `req.user.tenantId`
// ils échouaient tous en 500 sur `undefined`. La garde corrige les deux.
@ApiTags('Comptabilité SYSCOHADA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ─── Plan comptable ───────────────────────────────────────────────────────────

  @Get('chart')
  @ApiOperation({
    summary: 'Plan comptable SYSCOHADA complet',
    description: 'Retourne la liste complète des comptes du plan comptable SYSCOHADA actifs pour le tenant',
  })
  @ApiResponse({ status: 200, description: 'Liste des comptes comptables' })
  getChartOfAccounts(@Req() req: any) {
    return this.accountingService.getChartOfAccounts(req.user.tenantId);
  }

  @Post('chart')
  @ApiOperation({
    summary: 'Créer un nouveau compte dans le plan comptable',
    description: 'Ajoute un compte personnalisé au plan comptable SYSCOHADA du tenant',
  })
  @ApiResponse({ status: 201, description: 'Compte créé avec succès' })
  @ApiResponse({ status: 400, description: 'Numéro de compte déjà existant ou données invalides' })
  createAccount(@Body() dto: CreateChartOfAccountDto, @Req() req: any) {
    return this.accountingService.createAccount(dto, req.user.tenantId);
  }

  // ─── Journal comptable ────────────────────────────────────────────────────────

  @Post('journal')
  @ApiOperation({
    summary: 'Saisir une écriture comptable',
    description: 'Crée une écriture en partie double. Le total débit doit impérativement égaler le total crédit.',
  })
  @ApiResponse({ status: 201, description: 'Écriture comptable créée' })
  @ApiResponse({ status: 400, description: 'Déséquilibre débit/crédit ou compte introuvable' })
  @ApiResponse({ status: 404, description: 'Exercice fiscal introuvable ou clôturé' })
  createJournalEntry(@Body() dto: CreateJournalEntryDto, @Req() req: any) {
    return this.accountingService.createJournalEntry(
      dto,
      req.user.tenantId,
      req.user.id,
      false,
    );
  }

  @Get('journal')
  @ApiOperation({
    summary: 'Grand livre — liste des écritures comptables',
    description: 'Retourne les écritures du journal avec filtres par compte, date et exercice fiscal',
  })
  @ApiResponse({ status: 200, description: 'Liste paginée des écritures' })
  getJournal(@Query() query: QueryLedgerDto, @Req() req: any) {
    return this.accountingService.getJournal(query, req.user.tenantId);
  }

  @Get('journal/:id')
  @ApiOperation({ summary: "Détail d'une écriture comptable" })
  @ApiParam({ name: 'id', description: "UUID de l'écriture" })
  @ApiResponse({ status: 200, description: 'Détail de l\'écriture avec ses lignes' })
  @ApiResponse({ status: 404, description: 'Écriture introuvable' })
  getJournalEntry(@Param('id') id: string, @Req() req: any) {
    return this.accountingService.getJournalEntry(id, req.user.tenantId);
  }

  // ─── Grand livre par compte ───────────────────────────────────────────────────

  @Get('ledger')
  @ApiOperation({
    summary: 'Balance générale de tous les comptes',
    description: 'Retourne le solde (débit, crédit, balance) de chaque compte du plan comptable',
  })
  @ApiResponse({ status: 200, description: 'Balance générale' })
  async getLedger(@Query() query: QueryLedgerDto, @Req() req: any) {
    return this.accountingService.getTrialBalance(
      req.user.tenantId,
      query.fiscalYearId,
    );
  }

  @Get('ledger/:accountNumber')
  @ApiOperation({
    summary: 'Solde et mouvements d\'un compte spécifique',
    description: 'Retourne le détail des écritures et le solde pour un numéro de compte SYSCOHADA',
  })
  @ApiParam({ name: 'accountNumber', description: 'Numéro de compte (ex: 571, 706)', example: '571' })
  @ApiResponse({ status: 200, description: 'Détail du grand livre pour ce compte' })
  @ApiResponse({ status: 404, description: 'Compte introuvable' })
  getLedgerAccount(
    @Param('accountNumber') accountNumber: string,
    @Query() query: QueryLedgerDto,
    @Req() req: any,
  ) {
    return this.accountingService.getLedgerAccount(
      accountNumber,
      req.user.tenantId,
      query,
    );
  }

  // ─── États financiers ─────────────────────────────────────────────────────────

  @Get('trial-balance')
  @ApiOperation({
    summary: 'Balance de vérification',
    description: 'Vérifie l\'équilibre total débit = total crédit. Prerequis à la clôture d\'exercice.',
  })
  @ApiQuery({ name: 'fiscalYearId', required: false, description: "ID de l'exercice fiscal" })
  @ApiResponse({ status: 200, description: 'Balance de vérification avec indicateur d\'équilibre' })
  getTrialBalance(
    @Query('fiscalYearId') fiscalYearId: string | undefined,
    @Req() req: any,
  ) {
    return this.accountingService.getTrialBalance(req.user.tenantId, fiscalYearId);
  }

  @Get('income-statement')
  @ApiOperation({
    summary: 'Compte de résultat (Produits − Charges)',
    description: 'Calcule le résultat net sur la période. Conforme au modèle SYSCOHADA.',
  })
  @ApiQuery({ name: 'fiscalYearId', required: false })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-12-31' })
  @ApiResponse({ status: 200, description: 'Compte de résultat détaillé' })
  getIncomeStatement(
    @Query('fiscalYearId') fiscalYearId: string | undefined,
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
    @Req() req: any,
  ) {
    return this.accountingService.getIncomeStatement(req.user.tenantId, {
      fiscalYearId,
      startDate,
      endDate,
    });
  }

  @Get('balance-sheet')
  @ApiOperation({
    summary: 'Bilan (Actif / Passif)',
    description: 'Bilan comptable à une date donnée. Total actif doit égaler total passif.',
  })
  @ApiQuery({ name: 'asOfDate', required: false, example: '2025-12-31' })
  @ApiQuery({ name: 'fiscalYearId', required: false })
  @ApiResponse({ status: 200, description: 'Bilan détaillé actif/passif' })
  getBalanceSheet(
    @Query('asOfDate') asOfDate: string | undefined,
    @Query('fiscalYearId') fiscalYearId: string | undefined,
    @Req() req: any,
  ) {
    return this.accountingService.getBalanceSheet(
      req.user.tenantId,
      asOfDate,
      fiscalYearId,
    );
  }

  @Get('cash-flow')
  @ApiOperation({
    summary: 'Tableau des flux de trésorerie',
    description: 'Flux opérationnels, d\'investissement et de financement sur la période.',
  })
  @ApiQuery({ name: 'fiscalYearId', required: false })
  @ApiQuery({ name: 'startDate', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2025-12-31' })
  @ApiResponse({ status: 200, description: 'Tableau des flux de trésorerie' })
  getCashFlow(
    @Query('fiscalYearId') fiscalYearId: string | undefined,
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
    @Req() req: any,
  ) {
    return this.accountingService.getCashFlow(req.user.tenantId, {
      fiscalYearId,
      startDate,
      endDate,
    });
  }

  // ─── Exercice fiscal ──────────────────────────────────────────────────────────

  @Post('fiscal-year')
  @ApiOperation({
    summary: 'Créer un exercice fiscal',
    description: 'Ouvre un nouvel exercice comptable. Un exercice ouvert est requis pour saisir des écritures.',
  })
  @ApiResponse({ status: 201, description: 'Exercice créé avec succès' })
  @ApiResponse({ status: 400, description: 'Chevauchement de dates ou données invalides' })
  createFiscalYear(@Body() dto: CreateFiscalYearDto, @Req() req: any) {
    return this.accountingService.createFiscalYear(
      dto,
      req.user.tenantId,
      req.user.id,
    );
  }

  @Post('fiscal-year/:id/close')
  @ApiOperation({
    summary: 'Clôturer un exercice fiscal',
    description: 'Clôture l\'exercice après vérification de l\'équilibre et génère l\'écriture de report à nouveau.',
  })
  @ApiParam({ name: 'id', description: "UUID de l'exercice fiscal" })
  @ApiResponse({ status: 200, description: 'Exercice clôturé avec écriture de report générée' })
  @ApiResponse({ status: 400, description: 'Balance déséquilibrée ou exercice déjà clôturé' })
  @ApiResponse({ status: 404, description: 'Exercice introuvable' })
  closeFiscalYear(
    @Param('id') id: string,
    @Body() _dto: CloseFiscalYearDto,
    @Req() req: any,
  ) {
    return this.accountingService.closeFiscalYear(id, req.user.tenantId, req.user.id);
  }

  @Get('fiscal-year')
  @ApiOperation({ summary: 'Liste des exercices fiscaux' })
  @ApiResponse({ status: 200, description: 'Liste des exercices avec leur statut' })
  getFiscalYears(@Req() req: any) {
    return this.accountingService.getFiscalYears(req.user.tenantId);
  }

  // ─── Rapprochement bancaire ────────────────────────────────────────────────────

  @Post('reconcile')
  @ApiOperation({
    summary: 'Rapprochement bancaire',
    description: 'Rapproche une écriture comptable avec une transaction Mobile Money ou un relevé bancaire.',
  })
  @ApiResponse({ status: 201, description: 'Rapprochement enregistré' })
  @ApiResponse({ status: 404, description: 'Écriture introuvable' })
  reconcile(@Body() dto: ReconcileDto, @Req() req: any) {
    return this.accountingService.reconcile(dto, req.user.tenantId, req.user.id);
  }

  @Get('reconcile/pending')
  @ApiOperation({
    summary: 'Écritures non rapprochées',
    description: 'Liste les écritures comptables en attente de rapprochement bancaire.',
  })
  @ApiResponse({ status: 200, description: 'Liste des écritures non rapprochées' })
  getPendingReconciliations(@Req() req: any) {
    return this.accountingService.getPendingReconciliations(req.user.tenantId);
  }

  // ─── Centres de coûts ─────────────────────────────────────────────────────────

  @Get('cost-centers')
  @ApiOperation({
    summary: 'Liste des centres de coûts',
    description: 'Centres de coûts utilisés pour la comptabilité analytique (classe 9).',
  })
  @ApiResponse({ status: 200, description: 'Liste des centres de coûts actifs' })
  getCostCenters(@Req() req: any) {
    return this.accountingService.getCostCenters(req.user.tenantId);
  }

  // ─── Génération automatique ────────────────────────────────────────────────────

  @Post('auto-entry')
  @ApiOperation({
    summary: 'Génération automatique d\'écriture depuis une transaction',
    description: 'Génère les écritures comptables en partie double depuis une transaction Mobile Money complétée.',
  })
  @ApiResponse({ status: 201, description: 'Écriture générée automatiquement' })
  @ApiResponse({ status: 400, description: 'Transaction déjà comptabilisée ou type non géré' })
  @ApiResponse({ status: 404, description: 'Transaction ou exercice fiscal introuvable' })
  autoEntry(@Body() dto: AutoEntryDto, @Req() req: any) {
    return this.accountingService.generateEntryFromTransactionId(
      dto.transactionId,
      dto.fiscalYearId,
      req.user.tenantId,
      req.user.id,
    );
  }
}
