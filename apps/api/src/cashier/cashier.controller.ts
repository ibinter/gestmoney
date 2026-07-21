import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CashierService,
  CaisseEntryDto,
  CloseCaisseDto,
  OpenCaisseDto,
} from './cashier.service';

class OpenCaisseRequest implements OpenCaisseDto {
  @ApiProperty() @IsNumber() @Min(0) soldInitial: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

class CloseCaisseRequest implements CloseCaisseDto {
  @ApiProperty() @IsNumber() @Min(0) soldeFinal: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

class EcritureRequest implements CaisseEntryDto {
  @ApiProperty() @IsNumber() @IsPositive() montant: number;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(500) motif: string;
  @ApiProperty({ enum: ['ENTREE', 'SORTIE'] })
  @IsIn(['ENTREE', 'SORTIE'])
  type: 'ENTREE' | 'SORTIE';
}

/**
 * Caisse de l'utilisateur courant. Routes alignées sur ce que consomme le
 * frontend (`/caisse/ecritures`, `/caisse/stats`) — cf. apps/web useCaisse.ts.
 */
@ApiTags('Caisse')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('caisse')
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques de la caisse (solde, entrées/sorties du jour)' })
  getStats(@Req() req: any) {
    return this.cashierService.getStats(req.user.id, req.user.tenantId);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Solde et état de la caisse' })
  getBalance(@Req() req: any) {
    return this.cashierService.getBalance(req.user.id, req.user.tenantId);
  }

  @Get('ecritures')
  @ApiOperation({ summary: 'Journal des écritures de caisse' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getEcritures(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.cashierService.getEcritures(
      req.user.id,
      req.user.tenantId,
      page ? +page : undefined,
      limit ? +limit : undefined,
    );
  }

  @Post('ecritures')
  @ApiOperation({ summary: 'Ajouter une écriture (entrée ou sortie) manuelle' })
  @ApiResponse({ status: 201, description: 'Écriture enregistrée' })
  @ApiResponse({ status: 400, description: 'Caisse non ouverte' })
  addEcriture(@Body() dto: EcritureRequest, @Req() req: any) {
    return this.cashierService.addEcriture(dto, req.user.tenantId, req.user.id);
  }

  @Post('open')
  @ApiOperation({ summary: 'Ouverture de caisse' })
  @ApiResponse({ status: 400, description: 'Caisse déjà ouverte / aucun agent rattaché' })
  open(@Body() dto: OpenCaisseRequest, @Req() req: any) {
    return this.cashierService.open(dto, req.user.tenantId, req.user.id);
  }

  @Post('close')
  @ApiOperation({ summary: "Clôture de caisse avec calcul d'écart" })
  close(@Body() dto: CloseCaisseRequest, @Req() req: any) {
    return this.cashierService.close(req.user.tenantId, req.user.id, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historique des mouvements de caisse' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.cashierService.getHistory(
      req.user.id,
      req.user.tenantId,
      page ? +page : undefined,
      limit ? +limit : undefined,
    );
  }
}
