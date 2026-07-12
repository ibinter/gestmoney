import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Prénom' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ description: 'Nom de famille' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ description: 'Numéro de téléphone (format E.164)' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'Adresse email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Adresse physique' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'ID opérateur principal' })
  @IsOptional()
  @IsString()
  operatorId?: string;

  @ApiPropertyOptional({ description: 'ID agence de rattachement' })
  @IsOptional()
  @IsString()
  agencyId?: string;
}
