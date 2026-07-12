import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class GeneratePayrollDto {
  @ApiProperty({ example: 2024, description: 'Année de la période de paie' })
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @ApiProperty({ example: 3, description: 'Mois de la période de paie (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiPropertyOptional({ example: 'uuid-employee', description: 'Générer pour un employé spécifique uniquement' })
  @IsOptional()
  @IsString()
  employeeId?: string;
}

export class ValidatePayrollDto {
  @ApiPropertyOptional({ example: 'Paie validée par le DRH' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'COMPTE-421-001' })
  @IsOptional()
  @IsString()
  syscohadaAccount?: string;
}

export class PayrollDto {
  @ApiProperty({ example: 'uuid-employee' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ example: 2024 })
  @IsInt()
  year: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiPropertyOptional({ example: 5000, description: 'Prime exceptionnelle' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bonus?: number;

  @ApiPropertyOptional({ example: 10000, description: 'Retenue exceptionnelle' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deduction?: number;

  @ApiPropertyOptional({ example: 'Avance sur salaire' })
  @IsOptional()
  @IsString()
  deductionReason?: string;
}
