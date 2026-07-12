import { IsString, IsOptional, IsArray, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '../../common/enums/role.enum';

export class CreateRoleDto {
  @ApiProperty({ enum: RoleType, example: RoleType.AGENT, description: 'Nom du rôle' })
  @IsEnum(RoleType)
  name: RoleType;

  @ApiPropertyOptional({ example: 'Agent de terrain Mobile Money' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ['transactions:read', 'float:read'], description: 'Permissions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class AssignRoleDto {
  @ApiProperty({ example: 'user-uuid-123', description: 'ID de l\'utilisateur' })
  @IsString()
  userId: string;

  @ApiProperty({ enum: RoleType, isArray: true, description: 'Rôles à assigner' })
  @IsEnum(RoleType, { each: true })
  roles: RoleType[];
}
