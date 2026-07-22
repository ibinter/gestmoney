import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  MobileMoneyOperator,
  TransactionStatus,
  TransactionType,
} from '../interfaces/transaction.interface';

export class QueryTransactionDto {
  @ApiPropertyOptional({ description: 'Date de début (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional({ description: 'Date de fin (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @ApiPropertyOptional({ enum: ['DEPOT', 'RETRAIT', 'CASH_IN', 'CASH_OUT', 'PAIEMENT_MARCHAND', 'TRANSFERT', 'ANNULATION', 'REVERSAL'] })
  @IsOptional()
  @IsEnum(['DEPOT', 'RETRAIT', 'CASH_IN', 'CASH_OUT', 'PAIEMENT_MARCHAND', 'TRANSFERT', 'ANNULATION', 'REVERSAL'])
  type?: TransactionType;

  @ApiPropertyOptional({ enum: ['ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY', 'M_PESA', 'FREE_MONEY', 'TMONEY'] })
  @IsOptional()
  @IsEnum(['ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY', 'M_PESA', 'FREE_MONEY', 'TMONEY'])
  operateur?: MobileMoneyOperator;

  @ApiPropertyOptional({ enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED'])
  statut?: TransactionStatus;

  @ApiPropertyOptional({ description: "ID de l'agent (CUID)" })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional({ description: "ID de l'agence (CUID)" })
  @IsOptional()
  @IsString()
  agenceId?: string;

  @ApiPropertyOptional({ description: 'Montant minimum' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montantMin?: number;

  @ApiPropertyOptional({ description: 'Montant maximum' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  montantMax?: number;

  @ApiPropertyOptional({ description: 'Numéro de téléphone client' })
  @IsOptional()
  @IsString()
  clientPhone?: string;

  @ApiPropertyOptional({ description: 'Terme de recherche (référence, téléphone)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Numéro de page', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Taille de la page', default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Champ de tri', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Ordre de tri', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
