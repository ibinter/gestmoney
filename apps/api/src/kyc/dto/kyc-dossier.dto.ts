import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TypeDocumentKyc {
  CNI = 'CNI',
  PASSEPORT = 'PASSEPORT',
  PERMIS = 'PERMIS',
  CARTE_SEJOUR = 'CARTE_SEJOUR',
}

export class SoumettreDocumentsDto {
  @ApiProperty({ enum: TypeDocumentKyc })
  @IsEnum(TypeDocumentKyc)
  typeDocument: TypeDocumentKyc;

  @ApiProperty({ description: 'Numéro du document' })
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  numeroDocument: string;

  @ApiPropertyOptional({ description: "Date d'expiration ISO 8601" })
  @IsOptional()
  @IsDateString()
  dateExpiration?: string;

  @ApiPropertyOptional({ description: 'Pays émetteur (ISO 3166)' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  paysEmetteur?: string;

  @ApiPropertyOptional({ description: 'Photo recto en data URL base64 (max 5 Mo)' })
  @IsOptional()
  @IsString()
  photoRecto?: string;

  @ApiPropertyOptional({ description: 'Photo verso en data URL base64 (max 5 Mo)' })
  @IsOptional()
  @IsString()
  photoVerso?: string;

  @ApiPropertyOptional({ description: 'Photo selfie avec document (max 5 Mo)' })
  @IsOptional()
  @IsString()
  photoSelfie?: string;
}

export class ValiderDossierDto {
  @ApiPropertyOptional({ description: 'Note du vérificateur (optionnel)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  commentaire?: string;
}

export class RefuserDossierDto {
  @ApiProperty({ description: 'Raison obligatoire du refus' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  commentaire: string;
}

export class QueryKycDossiersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  statut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: string;
}
