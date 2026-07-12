import { IsString, IsOptional, IsEmail, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgencyDto {
  @ApiProperty({ example: 'Agence Cocody Riviera', description: 'Nom de l\'agence' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'AGC-001', description: 'Code unique de l\'agence' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ example: 'Abidjan, Cocody, Riviera 3', description: 'Adresse physique' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Abidjan', description: 'Ville' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'CI', description: 'Pays (code ISO)' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '+2250102030405', description: 'Téléphone de l\'agence' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'agence@gestmoney.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'network-uuid-123', description: 'ID du réseau auquel appartient l\'agence' })
  @IsString()
  networkId: string;

  @ApiPropertyOptional({ example: 'manager-user-uuid', description: 'ID du responsable de l\'agence' })
  @IsOptional()
  @IsString()
  managerId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
