import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { MobileMoneyOperator } from '../../transactions/interfaces/transaction.interface';

export class ReplenishmentRequestDto {
  @ApiProperty({ description: "ID de l'agent demandeur" })
  @IsUUID()
  @IsNotEmpty()
  agentId: string;

  @ApiProperty({ enum: ['ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY', 'M_PESA', 'FREE_MONEY', 'TMONEY'] })
  @IsEnum(['ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY', 'M_PESA', 'FREE_MONEY', 'TMONEY'])
  operateur: MobileMoneyOperator;

  @ApiProperty({ description: 'Montant de réapprovisionnement demandé' })
  @IsNumber({ maxDecimalPlaces: 0 })
  @IsPositive()
  montantDemande: number;

  @ApiPropertyOptional({ description: 'Justification de la demande' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  justification?: string;
}

export class ApproveReplenishmentDto {
  @ApiPropertyOptional({ description: 'Montant approuvé (peut différer de la demande)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @IsPositive()
  montantApprouve?: number;

  @ApiPropertyOptional({ description: 'Commentaire du superviseur' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  commentaire?: string;
}

export class RejectReplenishmentDto {
  @ApiProperty({ description: 'Motif de rejet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  motif: string;
}
