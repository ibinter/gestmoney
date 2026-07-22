import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriorite, TicketStatut } from '@prisma/client';

export class CreateTicketDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  objet: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  categorie?: string;

  @ApiPropertyOptional({ enum: TicketPriorite })
  @IsOptional()
  @IsEnum(TicketPriorite)
  priorite?: TicketPriorite;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  module?: string;
}

export class CreateTicketMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contenu: string;
}

export class ChangerStatutTicketDto {
  @ApiProperty({ enum: TicketStatut })
  @IsEnum(TicketStatut)
  statut: TicketStatut;
}
