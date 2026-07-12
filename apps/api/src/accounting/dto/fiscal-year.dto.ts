import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFiscalYearDto {
  @ApiProperty({ description: "Libellé de l'exercice fiscal", example: 'Exercice 2025' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label: string;

  @ApiProperty({ description: "Date de début de l'exercice (ISO)", example: '2025-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: "Date de fin de l'exercice (ISO)", example: '2025-12-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Notes ou commentaires' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CloseFiscalYearDto {
  @ApiPropertyOptional({ description: 'Notes de clôture' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
