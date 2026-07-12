import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '../../common/enums/role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'Jean', description: 'Prénom' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Dupont', description: 'Nom de famille' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'jean.dupont@gestmoney.com', description: 'Adresse email' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({ example: 'Secure@Pass123!', description: 'Mot de passe (min 8 chars, majuscule, chiffre, spécial)' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
  })
  password: string;

  @ApiPropertyOptional({ example: '+2250102030405', description: 'Numéro de téléphone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: RoleType, description: 'Rôle initial' })
  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;

  @ApiPropertyOptional({ example: 'tenant-001', description: 'Identifiant du tenant' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
