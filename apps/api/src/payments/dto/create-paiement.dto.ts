import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProvider, PaiementStatut } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePaiementDto {
  @ApiProperty({ description: 'Montant attendu', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  montant: number;

  @ApiPropertyOptional({ description: 'Devise ISO', default: 'XOF' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  devise?: string;

  @ApiProperty({ enum: PaymentProvider, description: 'Fournisseur / canal de paiement' })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiPropertyOptional({ description: 'Identifiant de la configuration choisie' })
  @IsOptional()
  @IsString()
  configId?: string;

  @ApiPropertyOptional({ description: 'Plan / abonnement visé' })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({ description: 'Métadonnées libres (non sensibles)' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ListPaiementsQueryDto {
  @ApiPropertyOptional({ enum: PaiementStatut })
  @IsOptional()
  @IsEnum(PaiementStatut)
  statut?: PaiementStatut;

  @ApiPropertyOptional({ enum: PaymentProvider })
  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;
}
