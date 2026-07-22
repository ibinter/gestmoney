import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { MobileMoneyOperator } from '../../transactions/interfaces/transaction.interface';

export class CreateFloatMovementDto {
  @ApiProperty({ description: "ID de l'agent" })
  @IsString()
  @IsNotEmpty()
  agentId: string;

  @ApiProperty({
    enum: ['ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY', 'M_PESA', 'FREE_MONEY', 'TMONEY'],
  })
  @IsEnum(['ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY', 'M_PESA', 'FREE_MONEY', 'TMONEY'])
  operateur: MobileMoneyOperator;

  @ApiProperty({ enum: ['CREDIT', 'DEBIT'], description: 'Type de mouvement' })
  @IsEnum(['CREDIT', 'DEBIT'])
  type: 'CREDIT' | 'DEBIT';

  @ApiProperty({ description: 'Montant du mouvement en FCFA' })
  @IsNumber({ maxDecimalPlaces: 0 })
  @IsPositive()
  montant: number;

  @ApiPropertyOptional({ description: 'Motif du mouvement' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motif?: string;

  @ApiPropertyOptional({ description: 'ID de la transaction associée' })
  @IsOptional()
  @IsString()
  transactionId?: string;
}
