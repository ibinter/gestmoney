import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@gestmoney.com', description: 'Adresse email' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({ example: 'Admin@123456!', description: 'Mot de passe' })
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;

  @ApiPropertyOptional({ example: 'tenant-001', description: 'Identifiant du tenant' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ example: '123456', description: 'Code 2FA (si activé)' })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;
}
