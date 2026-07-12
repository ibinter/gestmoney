import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum MovementReason {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  RETURN = 'RETURN',
  DAMAGE = 'DAMAGE',
  THEFT = 'THEFT',
  TRANSFER = 'TRANSFER',
  INVENTORY = 'INVENTORY',
}

export class StockMovementDto {
  @ApiProperty({ description: 'ID produit' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'ID agence' })
  @IsString()
  agencyId: string;

  @ApiProperty({ description: 'Quantité', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ enum: MovementReason })
  @IsEnum(MovementReason)
  reason: MovementReason;

  @ApiPropertyOptional({ description: 'Notes / commentaires' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Référence bon de commande / livraison' })
  @IsOptional()
  @IsString()
  reference?: string;
}
