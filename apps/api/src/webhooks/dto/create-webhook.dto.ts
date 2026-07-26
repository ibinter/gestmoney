import { IsArray, IsBoolean, IsOptional, IsString, IsUrl, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWebhookDto {
  @ApiProperty({ example: 'https://mon-erp.exemple.com/webhook' })
  @IsUrl({ require_tld: false })
  url: string;

  @ApiProperty({
    example: ['transaction.created', 'float.updated'],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  evenements: string[];

  @ApiPropertyOptional({ example: 'Webhook vers ERP principal' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
