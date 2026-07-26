import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ImportType {
  CLIENTS = 'clients',
  AGENTS = 'agents',
  TRANSACTIONS = 'transactions',
}

export class ImportTypeParamDto {
  @ApiProperty({ enum: ImportType, description: 'Type de données à importer' })
  @IsEnum(ImportType)
  type: ImportType;
}

// Résultat d'une ligne en erreur
export interface ImportRowError {
  ligne: number;
  colonne: string;
  message: string;
}

// Rapport retourné après un import
export interface ImportReport {
  type: ImportType;
  total: number;
  importees: number;
  erreurs: number;
  details: ImportRowError[];
  dureeMs: number;
}
