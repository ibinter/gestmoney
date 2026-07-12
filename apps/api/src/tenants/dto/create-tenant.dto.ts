import { IsString, IsOptional, IsEmail, MaxLength, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'reseau-orange-ci', description: 'Identifiant unique du tenant (slug)' })
  @IsString()
  @MaxLength(50)
  id: string;

  @ApiProperty({ example: 'Réseau Orange Money CI', description: 'Nom du tenant' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Réseau Orange Money Côte d\'Ivoire', description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'admin@orange-ci.com', description: 'Email administrateur' })
  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @ApiPropertyOptional({ example: 'CI', description: 'Pays (code ISO)' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'XOF', description: 'Devise (code ISO)' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'fr', description: 'Langue par défaut' })
  @IsOptional()
  @IsString()
  defaultLocale?: string;

  @ApiPropertyOptional({ example: 'https://logo.example.com/logo.png', description: 'URL du logo' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'Réseau Orange Money CI (Mis à jour)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultLocale?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
