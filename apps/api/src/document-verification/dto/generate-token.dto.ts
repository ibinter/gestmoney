import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateTokenDto {
  @ApiProperty({ description: 'Identifiant du document (ex: ID transaction, rapport…)' })
  @IsString()
  @IsNotEmpty()
  documentId: string;

  @ApiProperty({
    description: 'Type de document',
    example: 'RECU_TRANSACTION',
    enum: ['RECU_TRANSACTION', 'RAPPORT', 'FACTURE'],
  })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiPropertyOptional({
    description: 'Échantillon de contenu pour le hash SHA-256 (référence, montant…)',
  })
  @IsString()
  @IsOptional()
  contentSample?: string;
}
