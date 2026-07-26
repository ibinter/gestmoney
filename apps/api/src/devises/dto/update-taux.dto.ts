import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export const DEVISES_CIBLES = ['EUR', 'USD', 'GBP', 'CNY'] as const;
export type DeviseCible = (typeof DEVISES_CIBLES)[number];

export class UpdateTauxDto {
  @ApiProperty({ description: 'Devise de base', example: 'XOF' })
  @IsString()
  deviseBase: string;

  @ApiProperty({ enum: DEVISES_CIBLES, description: 'Devise cible' })
  @IsIn(DEVISES_CIBLES as unknown as string[])
  deviseCible: DeviseCible;

  @ApiProperty({ description: 'Taux (1 XOF = taux × deviseCible)', example: 0.00152 })
  @IsNumber({ maxDecimalPlaces: 8 })
  @IsPositive()
  taux: number;

  @ApiPropertyOptional({ description: 'Source du taux', example: 'MANUAL' })
  @IsOptional()
  @IsString()
  source?: string;
}
