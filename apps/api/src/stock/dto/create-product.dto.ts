import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export enum ProductCategory {
  SIM = 'SIM',
  TERMINAL = 'TERMINAL',
  ACCESSOIRE = 'ACCESSOIRE',
  CONSOMMABLE = 'CONSOMMABLE',
}

export class CreateProductDto {
  @ApiProperty({ description: 'Nom du produit' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ description: 'Référence / SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ enum: ProductCategory })
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @ApiPropertyOptional({ description: 'Description du produit' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Prix unitaire HT (XOF)', minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Seuil d\'alerte stock bas', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  alertThreshold?: number;

  @ApiPropertyOptional({ description: 'ID fournisseur principal' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Unité de mesure (ex: unité, boîte)' })
  @IsOptional()
  @IsString()
  unit?: string;
}
