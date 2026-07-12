import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Token de rafraîchissement' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
