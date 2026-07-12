import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, IsOptional, IsObject, Length } from 'class-validator';

export class CashInParamsDto {
  @ApiProperty({ description: 'Numéro de téléphone du client', example: '+2250700000001' })
  @IsString()
  @Length(8, 20)
  phone: string;

  @ApiProperty({ description: 'Montant à collecter', example: 10000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Devise', example: 'XOF' })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiProperty({ description: 'Référence unique de la transaction', example: 'TXN-20260101-ABC123' })
  @IsString()
  @Length(3, 64)
  reference: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Métadonnées additionnelles' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CashOutParamsDto {
  @ApiProperty({ description: 'Numéro de téléphone du destinataire', example: '+2250700000001' })
  @IsString()
  @Length(8, 20)
  phone: string;

  @ApiProperty({ description: 'Montant à décaisser', example: 5000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Devise', example: 'XOF' })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiProperty({ description: 'Référence unique', example: 'TXN-20260101-XYZ456' })
  @IsString()
  @Length(3, 64)
  reference: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Métadonnées additionnelles' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
