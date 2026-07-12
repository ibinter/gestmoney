import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum LeaveType {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  MATERNITY = 'MATERNITY',
  PATERNITY = 'PATERNITY',
  UNPAID = 'UNPAID',
  EXCEPTIONAL = 'EXCEPTIONAL',
}

export class LeaveRequestDto {
  @ApiProperty({ enum: LeaveType })
  @IsEnum(LeaveType)
  type: LeaveType;

  @ApiProperty({ example: '2024-04-01' })
  @IsISO8601()
  startDate: string;

  @ApiProperty({ example: '2024-04-10' })
  @IsISO8601()
  endDate: string;

  @ApiPropertyOptional({ example: 'Congé annuel pour repos' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class LeaveApprovalDto {
  @ApiPropertyOptional({ example: 'Approuvé — bon repos' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class LeaveRejectionDto {
  @ApiProperty({ example: 'Période de forte activité — décaler au mois prochain' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
