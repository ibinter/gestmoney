import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * Création d'une configuration de moyen de paiement.
 *
 * `secrets` est accepté en entrée (l'administrateur saisit ses clés) mais
 * n'est JAMAIS renvoyé : il est chiffré au repos et le service le retire de
 * toute réponse.
 */
export class CreatePaymentConfigDto {
  @ApiPropertyOptional({
    description: 'Tenant propriétaire. Absent = configuration globale plateforme',
  })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Méthode de paiement' })
  @IsEnum(PaymentMethod)
  methode: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Variante : ORANGE_MONEY, MTN, WAVE, USDT_TRC20…',
    default: '',
  })
  @IsOptional()
  @IsString()
  variante?: string;

  @ApiProperty({ description: 'Libellé affiché au client' })
  @IsString()
  @MinLength(2)
  libelle: string;

  @ApiPropertyOptional({ description: 'Méthode activée', default: false })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  @ApiPropertyOptional({ description: 'Mode bac à sable', default: true })
  @IsOptional()
  @IsBoolean()
  sandbox?: boolean;

  @ApiPropertyOptional({
    description:
      'Paramètres NON sensibles, affichables au client (numéro de réception, IBAN, instructions…)',
  })
  @IsOptional()
  @IsObject()
  parametres?: Record<string, any>;

  @ApiPropertyOptional({
    description:
      'Clés secrètes (api_key, webhook_secret…). Chiffrées au repos, jamais renvoyées.',
  })
  @IsOptional()
  @IsObject()
  secrets?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Codes pays autorisés. [] = aucune restriction', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paysAutorises?: string[];

  @ApiPropertyOptional({ description: 'Plans autorisés. [] = aucune restriction', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  plansAutorises?: string[];

  @ApiPropertyOptional({ description: 'Devises acceptées. [] = toutes', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  devises?: string[];

  @ApiPropertyOptional({ description: "Ordre d'affichage croissant", default: 0 })
  @IsOptional()
  @IsInt()
  ordreAffichage?: number;
}

export class UpdatePaymentConfigDto extends PartialType(CreatePaymentConfigDto) {}

/** Filtres de la recherche des méthodes proposables à un client. */
export class MethodesDisponiblesQueryDto {
  @ApiPropertyOptional({ description: 'Code pays ISO du client (ex. CI)' })
  @IsOptional()
  @IsString()
  pays?: string;

  @ApiPropertyOptional({ description: 'Plan visé par le client' })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({ description: 'Devise souhaitée (ex. XOF)' })
  @IsOptional()
  @IsString()
  devise?: string;
}

export class ToggleConfigDto {
  @ApiProperty({ description: 'Nouvel état d\'activation' })
  @IsBoolean()
  actif: boolean;
}
