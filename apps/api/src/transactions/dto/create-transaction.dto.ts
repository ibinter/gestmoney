import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MobileMoneyOperator,
  TransactionType,
} from '../interfaces/transaction.interface';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Montant de la transaction en FCFA', example: 50000 })
  @IsNumber({ maxDecimalPlaces: 0 })
  @IsPositive()
  @Min(100)
  montant: number;

  @ApiProperty({
    enum: [
      'DEPOT',
      'RETRAIT',
      'CASH_IN',
      'CASH_OUT',
      'PAIEMENT_MARCHAND',
      'TRANSFERT',
      'ANNULATION',
      'REVERSAL',
    ],
    description: 'Type de transaction',
  })
  @IsEnum(['DEPOT', 'RETRAIT', 'CASH_IN', 'CASH_OUT', 'PAIEMENT_MARCHAND', 'TRANSFERT', 'ANNULATION', 'REVERSAL'])
  type: TransactionType;

  @ApiProperty({
    enum: [
      'ORANGE_MONEY',
      'MTN_MOMO',
      'WAVE',
      'MOOV_MONEY',
      'AIRTEL_MONEY',
      'M_PESA',
      'FREE_MONEY',
      'TMONEY',
    ],
    description: 'Opérateur Mobile Money',
  })
  @IsEnum(['ORANGE_MONEY', 'MTN_MOMO', 'WAVE', 'MOOV_MONEY', 'AIRTEL_MONEY', 'M_PESA', 'FREE_MONEY', 'TMONEY'])
  operateur: MobileMoneyOperator;

  @ApiProperty({ description: "ID de l'agent exécutant la transaction" })
  @IsUUID()
  @IsNotEmpty()
  agentId: string;

  @ApiProperty({ description: 'Numéro de téléphone du client', example: '+22507XXXXXXXX' })
  @IsString()
  @IsNotEmpty()
  clientPhone: string;

  @ApiPropertyOptional({ description: 'Description ou motif de la transaction' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Métadonnées supplémentaires (JSON)' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
