import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseOrderLineDto {
  @ApiProperty({ description: 'ID produit' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Quantité commandée', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Prix unitaire négocié (XOF)', minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class PurchaseOrderDto {
  @ApiProperty({ description: 'ID fournisseur' })
  @IsString()
  supplierId: string;

  @ApiProperty({ description: 'ID agence destinataire' })
  @IsString()
  agencyId: string;

  @ApiProperty({ type: [PurchaseOrderLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  lines: PurchaseOrderLineDto[];

  @ApiPropertyOptional({ description: 'Date de livraison souhaitée' })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @ApiPropertyOptional({ description: 'Notes / conditions particulières' })
  @IsOptional()
  @IsString()
  notes?: string;
}
