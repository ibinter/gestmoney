import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class JournalLineDto {
  @ApiProperty({ description: 'Numéro de compte SYSCOHADA', example: '571' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ description: 'Libellé de la ligne', example: 'Dépôt client Orange Money' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  label: string;

  @ApiProperty({ description: 'Montant au débit (0 si crédit)', example: '50000.00' })
  @IsString()
  @IsNotEmpty()
  debit: string;

  @ApiProperty({ description: 'Montant au crédit (0 si débit)', example: '0.00' })
  @IsString()
  @IsNotEmpty()
  credit: string;

  @ApiPropertyOptional({ description: 'Devise (défaut: XOF)', example: 'XOF' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Taux de conversion vers XOF', example: 1 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  exchangeRate?: number;
}

export class CreateJournalEntryDto {
  @ApiProperty({ description: 'Date de comptabilisation', example: '2025-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Référence unique de la pièce comptable', example: 'PJ-2025-0001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  reference: string;

  @ApiProperty({ description: "Description / libellé de l'écriture", example: 'Encaissement commissions Janvier' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty({ description: "ID de l'exercice fiscal", type: String })
  @IsUUID()
  fiscalYearId: string;

  @ApiProperty({ description: 'Lignes de journal (débit = crédit obligatoire)', type: [JournalLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];

  @ApiPropertyOptional({ description: 'ID de la transaction source (Mobile Money)' })
  @IsOptional()
  @IsUUID()
  transactionId?: string;

  @ApiPropertyOptional({ description: "ID de l'agent concerné" })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @ApiPropertyOptional({ description: 'ID du centre de coûts' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;
}
