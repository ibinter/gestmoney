import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AgentStatus, MobileMoneyOperator } from './create-agent.dto';

export class QueryAgentDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Recherche par nom, code ou téléphone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrer par agence' })
  @IsOptional()
  @IsString()
  agencyId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par réseau' })
  @IsOptional()
  @IsString()
  networkId?: string;

  @ApiPropertyOptional({ enum: AgentStatus })
  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  @ApiPropertyOptional({ enum: MobileMoneyOperator })
  @IsOptional()
  @IsEnum(MobileMoneyOperator)
  operator?: MobileMoneyOperator;

  @ApiPropertyOptional({ description: 'Filtrer par zone' })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
