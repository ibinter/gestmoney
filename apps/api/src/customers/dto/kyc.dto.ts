import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SoumettreKycDto {
  @ApiPropertyOptional({ description: "Type de pièce (CNI, passeport…)" })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  documentType?: string;

  @ApiPropertyOptional({ description: 'Document en data URL base64' })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ description: "Numéro de pièce d'identité" })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  nationalId?: string;
}

export class RejeterKycDto {
  @ApiPropertyOptional({ description: 'Motif du rejet' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
