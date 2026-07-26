import { IsString, IsIn, IsOptional, IsBoolean } from 'class-validator';

export class CreateVersionDto {
  @IsString()
  version: string;

  @IsString()
  titre: string;

  @IsString()
  description: string;

  @IsIn(['MAJEURE', 'MINEURE', 'CORRECTIF', 'SECURITE'])
  type: 'MAJEURE' | 'MINEURE' | 'CORRECTIF' | 'SECURITE';

  @IsOptional()
  @IsBoolean()
  publiee?: boolean;
}
