import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UploadProofDto {
  @ApiProperty({ description: 'Identifiant du paiement concerné' })
  @IsString()
  paiementId: string;

  @ApiPropertyOptional({
    description: 'Référence textuelle : MTCN, numéro de chèque, hash blockchain…',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  referenceTexte?: string;
}

export class RejeterProofDto {
  @ApiProperty({ description: 'Motif de rejet — obligatoire' })
  @IsString()
  @MinLength(5, { message: 'Le motif de rejet doit être explicite (5 caractères minimum)' })
  @MaxLength(500)
  motifRejet: string;
}
