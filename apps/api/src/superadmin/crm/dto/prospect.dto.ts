import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsInt,
  IsEnum,
  IsNumber,
  MaxLength,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ProspectStatut,
  ProspectPriorite,
  ProspectOrigine,
} from '@prisma/client';

export class CreateProspectDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  nom: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  prenom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  entreprise?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fonction?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pays?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secteur?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tailleEntreprise?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logiciel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  besoin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  budgetIndicatif?: string;

  @ApiPropertyOptional({ enum: ProspectOrigine })
  @IsOptional()
  @IsEnum(ProspectOrigine)
  origine?: ProspectOrigine;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campagne?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsableId?: string;

  @ApiPropertyOptional({ enum: ProspectPriorite })
  @IsOptional()
  @IsEnum(ProspectPriorite)
  priorite?: ProspectPriorite;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiPropertyOptional({ enum: ProspectStatut })
  @IsOptional()
  @IsEnum(ProspectStatut)
  statut?: ProspectStatut;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  consentement?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prochainerAction?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateRelance?: string;
}

export class UpdateProspectDto extends CreateProspectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare nom: string;
}

export class ChangerStatutProspectDto {
  @ApiProperty({ enum: ProspectStatut })
  @IsEnum(ProspectStatut)
  statut: ProspectStatut;
}

export class ConvertirProspectDto {
  @ApiPropertyOptional({ description: 'Formule/plan de l\'offre générée' })
  @IsOptional()
  @IsString()
  formule?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  prixHT?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  remise?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  devise?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  validiteJours?: number;
}
