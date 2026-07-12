import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  MaxLength,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

export enum MobileMoneyOperator {
  ORANGE_MONEY = 'ORANGE_MONEY',
  MTN_MOMO = 'MTN_MOMO',
  WAVE = 'WAVE',
  MOOV_MONEY = 'MOOV_MONEY',
  FREE_MONEY = 'FREE_MONEY',
}

export class CreateAgentDto {
  @ApiProperty({ example: 'Jean Dupont', description: 'Nom complet de l\'agent' })
  @IsString()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: '+2250102030405', description: 'Numéro de téléphone' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'agent@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'AGT-2024-001', description: 'Code unique de l\'agent' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'agency-uuid-123', description: 'ID de l\'agence' })
  @IsString()
  agencyId: string;

  @ApiPropertyOptional({ enum: MobileMoneyOperator, isArray: true, description: 'Opérateurs gérés' })
  @IsOptional()
  @IsArray()
  @IsEnum(MobileMoneyOperator, { each: true })
  operators?: MobileMoneyOperator[];

  @ApiPropertyOptional({ example: 500000, description: 'Float initial (FCFA)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialFloat?: number;

  @ApiPropertyOptional({ example: 5000000, description: 'Limite de float maximale (FCFA)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  floatLimit?: number;

  @ApiPropertyOptional({ example: 'Abidjan, Cocody', description: 'Zone de couverture' })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiPropertyOptional({ description: 'Notes sur l\'agent' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'ID de l\'utilisateur lié à cet agent' })
  @IsOptional()
  @IsString()
  userId?: string;
}
