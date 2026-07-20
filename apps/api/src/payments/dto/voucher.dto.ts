import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VoucherStatut } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class GenererVouchersDto {
  @ApiProperty({ description: 'Nombre de codes à générer', minimum: 1, maximum: 5000 })
  @IsInt()
  @Min(1)
  @Max(5000)
  quantite: number;

  @ApiProperty({ description: 'Valeur faciale du code', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  valeur: number;

  @ApiPropertyOptional({ description: 'Devise ISO', default: 'XOF' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  devise?: string;

  @ApiPropertyOptional({ description: 'Plan accordé à l\'utilisation' })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({ description: 'Durée d\'abonnement en jours', default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  dureeJours?: number;

  @ApiPropertyOptional({ description: 'Nom du lot. Généré automatiquement si absent' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  lot?: string;

  @ApiPropertyOptional({ description: 'Validité en jours des codes du lot' })
  @IsOptional()
  @IsInt()
  @Min(1)
  validiteJours?: number;

  @ApiPropertyOptional({ description: 'Tenant propriétaire du lot' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class ConsommerVoucherDto {
  @ApiProperty({ description: 'Code du voucher' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  code: string;
}

export class ListVouchersQueryDto {
  @ApiPropertyOptional({ enum: VoucherStatut })
  @IsOptional()
  @IsEnum(VoucherStatut)
  statut?: VoucherStatut;

  @ApiPropertyOptional({ description: 'Filtrer sur un lot' })
  @IsOptional()
  @IsString()
  lot?: string;
}
