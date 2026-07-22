import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NetworkStatus } from '@prisma/client';

const CODE_REGEX = /^[A-Z0-9_]+$/;

export class CreateNetworkDto {
  @ApiProperty({ description: 'Code opérateur (ex. ORANGE_MONEY)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  @Matches(CODE_REGEX, {
    message: 'operatorCode : lettres majuscules, chiffres et _ uniquement',
  })
  operatorCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  country: string;

  @ApiPropertyOptional({ default: 'XOF' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ enum: NetworkStatus })
  @IsOptional()
  @IsEnum(NetworkStatus)
  status?: NetworkStatus;
}

export class UpdateNetworkDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(CODE_REGEX, {
    message: 'operatorCode : lettres majuscules, chiffres et _ uniquement',
  })
  operatorCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ enum: NetworkStatus })
  @IsOptional()
  @IsEnum(NetworkStatus)
  status?: NetworkStatus;
}
