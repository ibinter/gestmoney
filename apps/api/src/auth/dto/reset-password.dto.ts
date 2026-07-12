import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@gestmoney.com', description: 'Email du compte' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token de réinitialisation reçu par email' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewSecure@Pass123!', description: 'Nouveau mot de passe' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
  })
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Mot de passe actuel' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewSecure@Pass123!', description: 'Nouveau mot de passe' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
  })
  newPassword: string;
}

export class Verify2FADto {
  @ApiProperty({ example: '123456', description: 'Code TOTP 6 chiffres' })
  @IsString()
  code: string;
}
