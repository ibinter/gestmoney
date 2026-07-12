import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { ReportFormat, ReportType } from '../interfaces/report.interface';

export class GenerateReportDto {
  @ApiProperty({ enum: ReportType, description: 'Type de rapport' })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiPropertyOptional({ description: 'Date de début (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Date de fin (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'ID agent (pour rapport agent)' })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional({ description: 'ID agence' })
  @IsOptional()
  @IsString()
  agencyId?: string;

  @ApiPropertyOptional({ description: 'Code opérateur' })
  @IsOptional()
  @IsString()
  operatorCode?: string;

  @ApiProperty({ enum: ReportFormat, default: ReportFormat.PDF })
  @IsEnum(ReportFormat)
  format: ReportFormat = ReportFormat.PDF;
}
