import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryLedgerDto {
  @ApiPropertyOptional({ description: 'Numéro de compte SYSCOHADA à filtrer', example: '571' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Date de début (ISO)', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Date de fin (ISO)', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: "ID de l'exercice fiscal" })
  @IsOptional()
  @IsString()
  fiscalYearId?: string;

  @ApiPropertyOptional({ description: 'ID du centre de coûts' })
  @IsOptional()
  @IsString()
  costCenterId?: string;

  @ApiPropertyOptional({ description: 'Filtrer uniquement les écritures non rapprochées' })
  @IsOptional()
  isReconciled?: boolean;

  @ApiPropertyOptional({ description: 'Numéro de page (défaut: 1)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Résultats par page (défaut: 20)', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 20;
}
