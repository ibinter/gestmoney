import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum LeadSource {
  DEMO = 'DEMO',
  CONTACT = 'CONTACT',
  PARTENARIAT = 'PARTENARIAT',
}

export class CreateLeadDto {
  @IsString()
  @MaxLength(100)
  nom: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  societe?: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  message?: string;

  @IsEnum(LeadSource)
  @IsOptional()
  source?: LeadSource = LeadSource.DEMO;
}
