import { IsBoolean, IsInt, IsOptional, IsArray, IsString, Min } from 'class-validator';

export class UpdateConfigAlertesDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  seuilFloatBas?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  seuilVolumeTransaction?: number;

  @IsOptional()
  @IsBoolean()
  alerteFloatEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  alerteFloatInApp?: boolean;

  @IsOptional()
  @IsBoolean()
  alerteTransactionEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  alerteExpirationJ7?: boolean;

  @IsOptional()
  @IsBoolean()
  alerteExpirationJ30?: boolean;

  @IsOptional()
  @IsBoolean()
  alerteAudit?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emailsAlerte?: string[];
}

export class ListAlertesDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  lu?: boolean;
}
