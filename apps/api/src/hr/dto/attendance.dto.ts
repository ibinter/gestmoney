import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CheckInDto {
  @ApiPropertyOptional({ example: 'uuid-employee', description: 'Laissez vide pour l\'employé connecté' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ example: '5.345678,−4.012345', description: 'Coordonnées GPS' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Agence Abidjan Plateau' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CheckOutDto {
  @ApiPropertyOptional({ example: 'uuid-employee' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ example: '5.345678,−4.012345' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class AttendanceQueryDto {
  @ApiPropertyOptional({ example: 'uuid-employee' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ example: '2024-03-01' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ example: '2024-03-31' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
