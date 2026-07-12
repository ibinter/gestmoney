import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class LoyaltyRedeemDto {
  @ApiProperty({ description: 'Nombre de points à utiliser', minimum: 1 })
  @IsInt()
  @Min(1)
  points: number;

  @ApiPropertyOptional({ description: 'Description / motif d\'utilisation' })
  @IsOptional()
  @IsString()
  description?: string;
}
