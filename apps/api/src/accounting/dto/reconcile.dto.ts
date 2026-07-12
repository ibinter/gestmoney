import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ReconcileDto {
  @ApiProperty({ description: "ID de l'écriture de journal à rapprocher" })
  @IsUUID()
  journalEntryId: string;

  @ApiPropertyOptional({ description: 'ID de la transaction Mobile Money correspondante' })
  @IsOptional()
  @IsUUID()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Référence bancaire externe (relevé de banque)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankReference?: string;

  @ApiPropertyOptional({ description: 'Notes de rapprochement' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateChartOfAccountDto {
  @ApiProperty({ description: 'Numéro de compte SYSCOHADA', example: '5812' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ description: 'Libellé du compte', example: 'Float Orange Money - Agence Centre' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  label: string;

  @ApiProperty({
    description: 'Type de compte',
    enum: ['ACTIF', 'PASSIF', 'CHARGE', 'PRODUIT', 'TRESORERIE', 'CAPITAL', 'TIERS'],
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ description: 'Numéro du compte parent', example: '581' })
  @IsOptional()
  @IsString()
  parentAccountNumber?: string;

  @ApiPropertyOptional({ description: 'Devise du compte (défaut: XOF)', example: 'XOF' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class AutoEntryDto {
  @ApiProperty({ description: 'ID de la transaction Mobile Money source' })
  @IsUUID()
  transactionId: string;

  @ApiProperty({ description: "ID de l'exercice fiscal cible" })
  @IsUUID()
  fiscalYearId: string;
}
