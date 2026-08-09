import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { TenantPlan } from '@prisma/client';

/** Statuts métier du cycle de vie d'une licence. */
export enum StatutLicence {
  ESSAI = 'ESSAI',
  EN_ATTENTE_PAIEMENT = 'EN_ATTENTE_PAIEMENT',
  PROVISOIRE = 'PROVISOIRE',
  ACTIVE = 'ACTIVE',
  GRACE = 'GRACE',
  /**
   * Palier gratuit « Découverte ». L'accès à l'application reste OUVERT
   * (écriture autorisée), mais borné par les plafonds serveur (agences, agents,
   * transactions/mois). C'est l'état d'atterrissage d'un essai terminé sans
   * abonnement — jamais une coupure : le cahier IBIG interdit de couper.
   */
  DECOUVERTE = 'DECOUVERTE',
  EXPIREE = 'EXPIREE',
  SUSPENDUE = 'SUSPENDUE',
  REVOQUEE = 'REVOQUEE',
}

/** Compteurs de quota exposés au palier Découverte. */
export type CompteurQuota = 'agences' | 'agents' | 'transactionsMois';

/** État d'un compteur : valeur courante, plafond, reste, autorisation d'écrire. */
export interface EtatQuota {
  compteur: CompteurQuota;
  valeur: number;
  plafond: number;
  restant: number;
  autorise: boolean;
}

export class ActiverEssaiDto {
  @ApiPropertyOptional({ description: "Durée de l'essai en jours (défaut : configuration)" })
  @IsOptional()
  @IsInt()
  @IsPositive()
  dureeJours?: number;

  @ApiPropertyOptional({ enum: TenantPlan, description: "Plan associé à l'essai" })
  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;
}

export class RenouvelerDto {
  @ApiProperty({ description: 'Nombre de mois de renouvellement', example: 12 })
  @IsInt()
  @IsPositive()
  dureeMois: number;

  @ApiPropertyOptional({ description: 'Montant réglé' })
  @IsOptional()
  @IsNumber()
  montant?: number;

  @ApiPropertyOptional({ description: 'Devise du montant', example: 'XOF' })
  @IsOptional()
  @IsString()
  devise?: string;

  @ApiPropertyOptional({ description: 'Référence du paiement associé' })
  @IsOptional()
  @IsString()
  referencePaiement?: string;
}

export class ChangerPlanDto {
  @ApiProperty({ enum: TenantPlan, description: 'Nouveau plan' })
  @IsEnum(TenantPlan)
  plan: TenantPlan;

  @ApiPropertyOptional({ description: 'Motif du changement' })
  @IsOptional()
  @IsString()
  motif?: string;

  @ApiPropertyOptional({ description: 'Montant de la régularisation' })
  @IsOptional()
  @IsNumber()
  montant?: number;
}

export class LicenceProvisoireDto {
  @ApiProperty({
    description: 'Durée de la licence provisoire en jours (plafonnée par la configuration)',
    example: 7,
  })
  @IsInt()
  @IsPositive()
  @Max(365) // garde-fou grossier ; le vrai plafond est appliqué par le service
  dureeJours: number;

  @ApiProperty({ description: "Motif de l'octroi — obligatoire pour la traçabilité" })
  @IsString()
  @MinLength(3)
  motif: string;

  @ApiPropertyOptional({ enum: TenantPlan })
  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;
}

export class MotifDto {
  @ApiProperty({ description: "Motif de l'opération" })
  @IsString()
  @MinLength(3)
  motif: string;
}

export class HistoriqueQueryDto {
  @ApiPropertyOptional({ description: 'Nombre maximum d’événements', default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @ApiPropertyOptional({ description: 'Décalage de pagination', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

/** Activation d'abonnement demandée par le module paiements. */
export interface ActivationDepuisPaiement {
  tenantId: string;
  /** Durée souscrite, en mois. */
  dureeMois: number;
  plan?: TenantPlan;
  montant?: number;
  devise?: string;
  referencePaiement?: string;
  offreId?: string;
  agentId?: string;
}

/** Vue consolidée du statut d'une licence. */
export interface StatutLicenceResultat {
  tenantId: string;
  statut: StatutLicence;
  plan: TenantPlan;
  actif: boolean;
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
  graceJusquA: Date | null;
  provisoireJusquA: Date | null;
  joursRestants: number | null;
  essaiConsomme: boolean;
  motif: string | null;
}
