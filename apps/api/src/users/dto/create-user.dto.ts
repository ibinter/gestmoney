import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'Jean' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Dupont' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'jean.dupont@gestmoney.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secure@Pass123!' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Mot de passe trop faible',
  })
  password: string;

  @ApiPropertyOptional({ example: '+2250102030405' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: RoleType, isArray: true })
  @IsOptional()
  @IsEnum(RoleType, { each: true })
  roles?: RoleType[];

  @ApiPropertyOptional({ example: true, description: 'Compte actif (false = INACTIVE)' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
