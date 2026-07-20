import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  Verify2FADto,
} from './dto/reset-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SansLicence } from '../common/decorators/sans-licence.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Auth')
// Connexion, inscription, refresh, déconnexion. Sans cette exemption, un client
// dont la licence a expiré ne pourrait même plus s'authentifier — donc plus
// jamais atteindre l'écran de paiement.
@SansLicence()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(
    @Body() loginDto: LoginDto,
    @TenantId() tenantId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto, tenantId || loginDto.tenantId);
    if (result.accessToken) {
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('gestmoney_token', result.accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7j
        path: '/',
      });
      res.cookie('gestmoney_refresh', result.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30j
        path: '/api/v1/auth/refresh',
      });
    }
    const { accessToken, refreshToken, ...safe } = result as any;
    return safe;
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enregistrement d\'un nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  async register(
    @Body() registerDto: RegisterDto,
    @TenantId() tenantId: string,
  ) {
    return this.authService.register(registerDto, tenantId || registerDto.tenantId || 'default');
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Déconnexion' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  async logout(
    @CurrentUser('id') userId: string,
    @TenantId() tenantId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie('gestmoney_token', { path: '/' });
    res.clearCookie('gestmoney_refresh', { path: '/api/v1/auth/refresh' });
    return this.authService.logout(userId, tenantId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renouveler le token d\'accès' })
  @ApiResponse({ status: 200, description: 'Tokens renouvelés' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @TenantId() tenantId: string,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Lire le refresh token depuis le cookie httpOnly (priorité) ou le body
    const refreshToken = req.cookies?.gestmoney_refresh || dto.refreshToken;
    const payload = await this.extractPayloadFromRefreshToken(refreshToken);
    const result = await this.authService.refreshTokens(payload.sub, tenantId, refreshToken);
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('gestmoney_token', result.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    res.cookie('gestmoney_refresh', result.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    });
    const { accessToken, refreshToken: _rt, ...safe } = result as any;
    return safe;
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demander une réinitialisation de mot de passe' })
  @ApiResponse({ status: 200, description: 'Email de réinitialisation envoyé' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @TenantId() tenantId: string,
  ) {
    return this.authService.forgotPassword(dto, tenantId);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réinitialiser le mot de passe avec le token' })
  @ApiResponse({ status: 200, description: 'Mot de passe réinitialisé' })
  @ApiResponse({ status: 400, description: 'Token invalide ou expiré' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @TenantId() tenantId: string,
  ) {
    return this.authService.resetPassword(dto, tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Changer son mot de passe (authentifié)' })
  @ApiResponse({ status: 200, description: 'Mot de passe modifié' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @TenantId() tenantId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, tenantId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtenir le profil de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Activer l\'authentification à deux facteurs (TOTP)' })
  @ApiResponse({ status: 200, description: 'QR Code et secret 2FA' })
  async enable2FA(@CurrentUser('id') userId: string) {
    return this.authService.enable2FA(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Vérifier et activer le code 2FA' })
  @ApiResponse({ status: 200, description: '2FA activé avec succès' })
  async verify2FA(
    @CurrentUser('id') userId: string,
    @TenantId() tenantId: string,
    @Body() dto: Verify2FADto,
  ) {
    return this.authService.verify2FA(userId, tenantId, dto);
  }

  // Méthode utilitaire pour décoder le refresh token sans vérifier
  private async extractPayloadFromRefreshToken(token: string): Promise<any> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Token invalide');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload;
    } catch {
      return { sub: '' };
    }
  }
}
