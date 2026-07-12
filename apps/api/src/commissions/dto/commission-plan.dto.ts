import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  MobileMoneyOperator,
  TransactionType,
} from '../../transactions/interfaces/transaction.interface';

export class CommissionTierDto {
  @ApiProperty({ description: 'Montant minimum du palier' })
  @IsNumber()
  @Min(0)
  montantMin: number;

  @ApiPropertyOptional({ description: 'Montant maximum du palier (null = pas de limite)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  montantMax?: number;

  @ApiProperty({ description: 'Taux de commission en % (ex: 1.5 = 1.5%)', example: 1.5 })
  @IsNumber()
  @Min(0)
  taux?: number;

  @ApiPropertyOptional({ description: 'Montant fixe de commission (alternatif au taux)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  montantFixe?: number;
}

export class CommissionPlanDto {
  @ApiProperty({ description: 'Nom de la grille tarifaire' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiPropertyOptional({ description: 'Description de la grille' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY', 'M_PESA', 'FREE_MONEY', 'TMONEY'] })
  @IsEnum(['ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY', 'M_PESA', 'FREE_MONEY', 'TMONEY'])
  operateur: MobileMoneyOperator;

  @ApiProperty({ enum: ['DEPOT', 'RETRAIT', 'CASH_IN', 'CASH_OUT', 'PAIEMENT_MARCHAND', 'TRANSFERT', 'ANNULATION', 'REVERSAL'] })
  @IsEnum(['DEPOT', 'RETRAIT', 'CASH_IN', 'CASH_OUT', 'PAIEMENT_MARCHAND', 'TRANSFERT', 'ANNULATION', 'REVERSAL'])
  typeTransaction: TransactionType;

  @ApiProperty({ description: 'Paliers de commission', type: [CommissionTierDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommissionTierDto)
  paliers: CommissionTierDto[];

  @ApiPropertyOptional({ description: 'Grille active ou non', default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @ApiPropertyOptional({ description: 'Part agent (% de la commission totale)', example: 70 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  partAgent?: number;

  @ApiPropertyOptional({ description: 'Part réseau (% de la commission totale)', example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  partReseau?: number;
}
