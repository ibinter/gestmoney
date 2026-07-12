import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum ContractType {
  CDI = 'CDI',
  CDD = 'CDD',
  STAGE = 'STAGE',
  FREELANCE = 'FREELANCE',
}

export class ContractDto {
  @ApiProperty({ example: 'uuid-employee' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ enum: ContractType })
  @IsEnum(ContractType)
  type: ContractType;

  @ApiProperty({ example: '2024-03-01' })
  @IsISO8601()
  startDate: string;

  @ApiPropertyOptional({ example: '2025-02-28', description: 'Requis pour CDD/STAGE' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiProperty({ example: 150000, description: 'Salaire de base brut en FCFA' })
  @IsNumber()
  @Min(0)
  baseSalary: number;

  @ApiPropertyOptional({ example: 10000, description: 'Prime de transport mensuelle' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  transportAllowance?: number;

  @ApiPropertyOptional({ example: 5000, description: 'Indemnité logement' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  housingAllowance?: number;

  @ApiPropertyOptional({ example: 'Poste d\'agent de terrain Mobile Money' })
  @IsOptional()
  @IsString()
  description?: string;
}
