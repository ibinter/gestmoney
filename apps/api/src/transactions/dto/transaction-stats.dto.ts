import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class TransactionStatsQueryDto {
  @ApiPropertyOptional({ description: 'Date de début pour le résumé (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional({ description: 'Date de fin pour le résumé (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFin?: string;
}
