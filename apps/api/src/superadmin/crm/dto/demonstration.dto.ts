import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DemoMode, DemoStatut } from '@prisma/client';

export class CreateDemonstrationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(160)
  entreprise: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logiciel?: string;

  @ApiProperty({ description: 'Date/heure ISO de la démonstration' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fuseau?: string;

  @ApiPropertyOptional({ enum: DemoMode })
  @IsOptional()
  @IsEnum(DemoMode)
  mode?: DemoMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lienVisio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  besoins?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: DemoStatut })
  @IsOptional()
  @IsEnum(DemoStatut)
  statut?: DemoStatut;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  compteRendu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prochainerEtape?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  confirme?: boolean;
}

export class UpdateDemonstrationDto extends CreateDemonstrationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare entreprise: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  declare date: string;
}

export class ChangerStatutDemoDto {
  @ApiProperty({ enum: DemoStatut })
  @IsEnum(DemoStatut)
  statut: DemoStatut;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  compteRendu?: string;
}
