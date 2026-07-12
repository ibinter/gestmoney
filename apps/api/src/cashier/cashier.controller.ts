import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CashierService,
  CaisseEntryDto,
  CloseCaisseDto,
  OpenCaisseDto,
  VaultOperationDto,
} from './cashier.service';

class OpenCaisseRequest implements OpenCaisseDto {
  @ApiProperty() @IsUUID() agentId: string;
  @ApiProperty() @IsNumber() @Min(0) soldInitial: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

class CloseCaisseRequest implements CloseCaisseDto {
  @ApiProperty() @IsNumber() @Min(0) soldeFinal: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

class CaisseEntryRequest implements CaisseEntryDto {
  @ApiProperty() @IsNumber() @IsPositive() montant: number;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(500) motif: string;
  @ApiProperty({ enum: ['ENTREE', 'SORTIE'] }) type: 'ENTREE' | 'SORTIE';
}

class VaultOperationRequest implements VaultOperationDto {
  @ApiProperty() @IsNumber() @IsPositive() montant: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) motif?: string;
}

@ApiTags('Caisse')
@ApiBearerAuth()
@Controller('cashier')
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Solde caisse actuel' })
  @ApiQuery({ name: 'agentId', required: true })
  @ApiResponse({ status: 200, description: 'Solde et état de la caisse' })
  getBalance(@Query('agentId') agentId: string, @Req() req: any) {
    return this.cashierService.getBalance(agentId, req.user.tenantId);
  }

  @Post('open')
  @ApiOperation({ summary: 'Ouverture de caisse' })
  @ApiResponse({ status: 201, description: 'Session caisse ouverte' })
  @ApiResponse({ status: 400, description: 'Caisse déjà ouverte' })
  open(@Body() dto: OpenCaisseRequest, @Req() req: any) {
    return this.cashierService.open(dto, req.user.tenantId, req.user.id);
  }

  @Post('close')
  @ApiOperation({ summary: 'Clôture de caisse avec calcul d\'écart' })
  @ApiQuery({ name: 'agentId', required: true })
  @ApiResponse({ status: 201, description: 'Caisse clôturée avec écart calculé' })
  close(
    @Query('agentId') agentId: string,
    @Body() dto: CloseCaisseRequest,
    @Req() req: any,
  ) {
    return this.cashierService.close(agentId, dto, req.user.tenantId, req.user.id);
  }

  @Post('entry')
  @ApiOperation({ summary: 'Entrée manuelle en caisse' })
  @ApiQuery({ name: 'agentId', required: true })
  entry(
    @Query('agentId') agentId: string,
    @Body() dto: CaisseEntryRequest,
    @Req() req: any,
  ) {
    return this.cashierService.addEntry(
      agentId,
      { ...dto, type: 'ENTREE' },
      req.user.tenantId,
      req.user.id,
    );
  }

  @Post('exit')
  @ApiOperation({ summary: 'Sortie manuelle de caisse' })
  @ApiQuery({ name: 'agentId', required: true })
  exit(
    @Query('agentId') agentId: string,
    @Body() dto: CaisseEntryRequest,
    @Req() req: any,
  ) {
    return this.cashierService.addEntry(
      agentId,
      { ...dto, type: 'SORTIE' },
      req.user.tenantId,
      req.user.id,
    );
  }

  @Get('movements')
  @ApiOperation({ summary: 'Mouvements de la session en cours' })
  @ApiQuery({ name: 'agentId', required: true })
  @ApiQuery({ name: 'sessionId', required: false })
  getMovements(
    @Query('agentId') agentId: string,
    @Query('sessionId') sessionId: string | undefined,
    @Req() req: any,
  ) {
    return this.cashierService.getMovements(agentId, req.user.tenantId, sessionId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historique des clôtures de caisse' })
  @ApiQuery({ name: 'agentId', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(
    @Query('agentId') agentId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Req() req: any,
  ) {
    return this.cashierService.getHistory(agentId, req.user.tenantId, +page, +limit);
  }

  @Post('vault/deposit')
  @ApiOperation({ summary: 'Dépôt en coffre (sortie caisse → coffre)' })
  @ApiQuery({ name: 'agentId', required: true })
  vaultDeposit(
    @Query('agentId') agentId: string,
    @Body() dto: VaultOperationRequest,
    @Req() req: any,
  ) {
    return this.cashierService.vaultDeposit(dto, agentId, req.user.tenantId, req.user.id);
  }

  @Post('vault/withdraw')
  @ApiOperation({ summary: 'Retrait coffre (coffre → caisse)' })
  @ApiQuery({ name: 'agentId', required: true })
  vaultWithdraw(
    @Query('agentId') agentId: string,
    @Body() dto: VaultOperationRequest,
    @Req() req: any,
  ) {
    return this.cashierService.vaultWithdraw(dto, agentId, req.user.tenantId, req.user.id);
  }
}
