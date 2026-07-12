import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
} from 'class-validator';
import { MobileMoneyOperator } from '../../transactions/interfaces/transaction.interface';

export class FloatThresholdDto {
  @ApiProperty({ description: "ID de l'agent" })
  @IsUUID()
  @IsNotEmpty()
  agentId: string;

  @ApiProperty({ enum: ['ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY', 'M_PESA', 'FREE_MONEY', 'TMONEY'] })
  @IsEnum(['ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY', 'M_PESA', 'FREE_MONEY', 'TMONEY'])
  operateur: MobileMoneyOperator;

  @ApiProperty({ description: 'Seuil minimum d\'alerte en FCFA' })
  @IsNumber({ maxDecimalPlaces: 0 })
  @IsPositive()
  seuilMin: number;

  @ApiPropertyOptional({ description: 'Seuil cible (après réappro) en FCFA' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @IsPositive()
  seuilCible?: number;
}
