import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsNumber,
  IsArray,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OffreStatut } from '@prisma/client';

export class CreateOffreDto {
  @ApiPropertyOptional({ description: 'Référence unique — générée si absente' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  demonstrationId?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(160)
  entreprise: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logiciel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  formule?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  modules?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  nbUtilisateurs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  nbSites?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  dureesMois?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  devise?: string;

  @ApiProperty({ description: 'Prix HT' })
  @IsNumber()
  @Min(0)
  prixHT: number;

  @ApiPropertyOptional({ description: 'Remise en %' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  remise?: number;

  @ApiPropertyOptional({ description: 'Taxes en %' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxes?: number;

  @ApiPropertyOptional({ description: 'Prix TTC — recalculé si absent' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prixTTC?: number;

  @ApiPropertyOptional()
  @IsOptional()
  formation?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  migration?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  accompagnement?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  validiteJours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conditions?: string;

  @ApiPropertyOptional({ enum: OffreStatut })
  @IsOptional()
  @IsEnum(OffreStatut)
  statut?: OffreStatut;
}

export class UpdateOffreDto extends CreateOffreDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare entreprise: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  declare prixHT: number;
}

export class ChangerStatutOffreDto {
  @ApiProperty({ enum: OffreStatut })
  @IsEnum(OffreStatut)
  statut: OffreStatut;
}
