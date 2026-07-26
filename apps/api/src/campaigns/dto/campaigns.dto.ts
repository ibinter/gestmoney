import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum CibleCampagne {
  PROSPECTS = 'PROSPECTS',
  EXPIRATION_7J = 'EXPIRATION_7J',
  EXPIRATION_30J = 'EXPIRATION_30J',
  SUSPENDUS = 'SUSPENDUS',
  TOUS_ADMINS = 'TOUS_ADMINS',
}

export class CreerCampagneDto {
  @IsString()
  @MaxLength(200)
  nom: string;

  @IsString()
  @MaxLength(300)
  sujet: string;

  @IsString()
  corps: string;

  @IsEnum(CibleCampagne)
  cible: CibleCampagne;

  @IsDateString()
  @IsOptional()
  planifieeA?: string;
}

export class PlanifierCampagneDto {
  @IsDateString()
  date: string;
}
