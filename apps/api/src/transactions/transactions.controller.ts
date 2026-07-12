import {
  Body,
  Controller,
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
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { TransactionStatsQueryDto } from './dto/transaction-stats.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle transaction' })
  @ApiResponse({ status: 201, description: 'Transaction créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou float insuffisant' })
  @ApiResponse({ status: 403, description: 'Agent suspendu' })
  create(@Body() dto: CreateTransactionDto, @Req() req: any) {
    const tenantId: string = req.user.tenantId;
    const userId: string = req.user.id;
    return this.transactionsService.create(dto, tenantId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les transactions avec filtres avancés' })
  @ApiResponse({ status: 200, description: 'Liste paginée des transactions' })
  findAll(@Query() query: QueryTransactionDto, @Req() req: any) {
    return this.transactionsService.findAll(query, req.user.tenantId);
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
    const csv = await this.transactionsService.exportCsv(query, req.user.tenantId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="transactions-${Date.now()}.csv"`,
    );
    res.send(csv);
  }

  @Post('bulk-import')
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

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une transaction' })
  @ApiParam({ name: 'id', description: 'ID de la transaction (UUID)' })
  @ApiResponse({ status: 200, description: 'Détail de la transaction' })
  @ApiResponse({ status: 404, description: 'Transaction introuvable' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.transactionsService.findOne(id, req.user.tenantId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Annuler une transaction en attente' })
  @ApiParam({ name: 'id', description: 'ID de la transaction' })
  @ApiResponse({ status: 200, description: 'Transaction annulée' })
  @ApiResponse({ status: 400, description: 'Transaction non annulable (statut incompatible)' })
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.transactionsService.cancel(id, req.user.tenantId, req.user.id);
  }

  @Post(':id/reverse')
  @ApiOperation({ summary: 'Reverser une transaction complétée' })
  @ApiParam({ name: 'id', description: 'ID de la transaction' })
  @ApiResponse({ status: 200, description: 'Transaction reversée' })
  @ApiResponse({ status: 400, description: 'Transaction non reversible' })
  reverse(@Param('id') id: string, @Req() req: any) {
    return this.transactionsService.reverse(id, req.user.tenantId, req.user.id);
  }
}
