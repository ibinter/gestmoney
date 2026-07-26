import { IsString, IsOptional, IsNumber, IsInt, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CategorieArticle {
  CONSOMMABLE = 'CONSOMMABLE',
  EQUIPEMENT = 'EQUIPEMENT',
  FOURNITURE = 'FOURNITURE',
}

export enum TypeMouvementArticle {
  ENTREE = 'ENTREE',
  SORTIE = 'SORTIE',
  AJUSTEMENT = 'AJUSTEMENT',
  INVENTAIRE = 'INVENTAIRE',
}

export class CreerArticleDto {
  @ApiProperty() @IsString() reference: string;
  @ApiProperty() @IsString() nom: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: CategorieArticle }) @IsOptional() @IsEnum(CategorieArticle) categorie?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unite?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() prixUnitaire?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) seuilAlerte?: number;
}

export class ModifierArticleDto {
  @ApiPropertyOptional() @IsOptional() @IsString() nom?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: CategorieArticle }) @IsOptional() @IsEnum(CategorieArticle) categorie?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unite?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() prixUnitaire?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) seuilAlerte?: number;
  @ApiPropertyOptional() @IsOptional() actif?: boolean;
}

export class EntreeStockDto {
  @ApiProperty() @IsInt() @Min(1) quantite: number;
  @ApiPropertyOptional() @IsOptional() @IsString() motif?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
}

export class SortieStockDto {
  @ApiProperty() @IsInt() @Min(1) quantite: number;
  @ApiPropertyOptional() @IsOptional() @IsString() motif?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
}

export class AjustementStockDto {
  @ApiProperty({ description: 'Nouvelle quantité exacte' }) @IsInt() @Min(0) nouvelleQuantite: number;
  @ApiPropertyOptional() @IsOptional() @IsString() motif?: string;
}
