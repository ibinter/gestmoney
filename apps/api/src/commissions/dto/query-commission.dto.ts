import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export type CommissionStatus = 'DUE' | 'PAID' | 'PENDING' | 'CANCELLED';

export class QueryCommissionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  agenceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @ApiPropertyOptional({ enum: ['DUE', 'PAID', 'PENDING', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['DUE', 'PAID', 'PENDING', 'CANCELLED'])
  statut?: CommissionStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CalculateCommissionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  agentId?: string;
}

export class ValidatePaymentDto {
  @ApiPropertyOptional({ description: 'IDs des commissions à payer (vide = toutes DUE)' })
  @IsOptional()
  @IsUUID(undefined, { each: true })
  commissionIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFin?: string;
}
