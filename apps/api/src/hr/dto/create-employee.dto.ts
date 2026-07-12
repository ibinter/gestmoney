import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Kofi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName: string;

  @ApiProperty({ example: 'Asante' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName: string;

  @ApiProperty({ example: 'kofi@gestmoney.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+22507000000' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  phone: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '1990-01-15' })
  @IsISO8601()
  birthDate: string;

  @ApiProperty({ example: '2024-03-01' })
  @IsISO8601()
  hireDate: string;

  @ApiProperty({ example: 'AG-001', description: 'Code agent GESTMONEY' })
  @IsString()
  @IsNotEmpty()
  agentCode: string;

  @ApiProperty({ example: 'uuid-agency' })
  @IsString()
  @IsNotEmpty()
  agencyId: string;

  @ApiProperty({ example: 'AGENT', description: 'Poste occupé' })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiPropertyOptional({ example: 'Gestion Mobile Money' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'CI-123456789' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({ example: 'CI-CNSS-000111' })
  @IsOptional()
  @IsString()
  cnssNumber?: string;
}
