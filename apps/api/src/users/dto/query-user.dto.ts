import { IsOptional, IsString, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '../../common/enums/role.enum';

export class QueryUserDto {
  @ApiPropertyOptional({ example: 1, description: 'Numéro de page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Nombre d\'éléments par page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Recherche par nom ou email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: RoleType, description: 'Filtrer par rôle' })
  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;

  @ApiPropertyOptional({ description: 'Filtrer par agence' })
  @IsOptional()
  @IsString()
  agencyId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par statut actif' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'createdAt', description: 'Champ de tri' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: 'Ordre de tri' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
