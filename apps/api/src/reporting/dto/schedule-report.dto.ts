import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  ArrayMinSize,
} from 'class-validator';
import { ReportFormat, ReportFrequency, ReportType } from '../interfaces/report.interface';

export class ScheduleReportDto {
  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ enum: ReportFrequency })
  @IsEnum(ReportFrequency)
  frequency: ReportFrequency;

  @ApiProperty({ type: [String], description: 'Emails destinataires' })
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  sendTo: string[];

  @ApiProperty({ enum: ReportFormat })
  @IsEnum(ReportFormat)
  format: ReportFormat;
}
