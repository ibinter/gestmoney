import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DocumentType {
  CNI = 'CNI',
  PASSPORT = 'PASSPORT',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  RESIDENCE_PERMIT = 'RESIDENCE_PERMIT',
  VOTER_CARD = 'VOTER_CARD',
}

export class KycSubmissionDto {
  @ApiProperty({ enum: DocumentType, description: 'Type de pièce d\'identité' })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ description: 'Numéro de la pièce d\'identité' })
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  documentNumber: string;

  @ApiProperty({ description: 'URL du document scanné (recto)' })
  @IsString()
  documentUrl: string;

  @ApiPropertyOptional({ description: 'URL du document scanné (verso)' })
  @IsOptional()
  @IsString()
  documentUrlBack?: string;

  @ApiProperty({ description: 'URL de la photo selfie avec le document' })
  @IsString()
  selfieUrl: string;

  @ApiPropertyOptional({ description: 'Date d\'expiration du document (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Code pays ISO 3166-1 alpha-2' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;
}

export class KycRejectDto {
  @ApiProperty({ description: 'Raison du rejet' })
  @IsString()
  @MinLength(10)
  reason: string;
}
