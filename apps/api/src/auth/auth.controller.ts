import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { Response } from 'express';

// Payload JSON de mise à jour d'avatar. On envoie l'image en data URL base64
// (et NON en multipart) : le multipart vers cet endpoint est réinitialisé par
// Cloudflare, alors qu'un POST JSON passe sans problème (comme le login).
class UpdateAvatarDto {
  @IsOptional()
  @IsString()
  image?: string;
}

class StartImpersonationDto {
  @IsString()
  targetUserId: string;

  @IsString()
  @MinLength(10, { message: 'La raison doit faire au moins 10 caractères' })
  raison: string;
}
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  Verify2FADto,
  Desactiver2FADto,
  LoginVerify2FADto,
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
  // Anti-bruteforce : 5 tentatives / minute par IP sur la connexion uniquement.
  // Signature @nestjs/throttler v5 : { <nom-du-throttler>: { limit, ttl } }.
  // Le throttler par defaut est nomme "default" (cf. ThrottlerModule dans
  // app.module.ts) ; ttl exprime en millisecondes (60000 = 60 s).
  @Throttle({ default: { limit: 5, ttl: 60000 } })
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
    // `login()` renvoie une union : soit le cas 2FA ({ requiresTwoFactor, userId }),
    // soit le cas nominal ({ user, accessToken, refreshToken }). On restreint le
    // type avant d'accéder aux jetons.
    if ('accessToken' in result && result.accessToken) {
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
    return this.authService.register(registerDto, tenantId || registerDto.tenantId);
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
  async getMe(@CurrentUser() user: any) {
    const profile = await this.authService.getProfile(user.id);
    // Injecter les champs d'impersonation pour le bandeau frontend
    if (user.impersonatedBy) {
      return {
        ...profile,
        impersonatedBy: user.impersonatedBy,
        impersonationId: user.impersonationId,
      };
    }
    return profile;
  }

  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour la photo de profil (data URL base64)' })
  @ApiResponse({ status: 200, description: 'Avatar mis à jour (data URL)' })
  async updateAvatar(
    @CurrentUser('id') userId: string,
    @Body() body: UpdateAvatarDto,
  ) {
    return this.authService.updateAvatar(userId, body.image ?? null);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('avatar')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer la photo de profil' })
  async removeAvatar(@CurrentUser('id') userId: string) {
    return this.authService.updateAvatar(userId, null);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lister les sessions actives de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Liste des sessions actives' })
  async getSessions(
    @CurrentUser('id') userId: string,
    @Request() req: any,
  ) {
    const currentRefreshToken = req.cookies?.gestmoney_refresh;
    return this.authService.getSessions(userId, currentRefreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Révoquer toutes les sessions sauf la courante' })
  @ApiResponse({ status: 200, description: 'Sessions révoquées' })
  async revokeAllSessions(
    @CurrentUser('id') userId: string,
    @Request() req: any,
  ) {
    const currentRefreshToken = req.cookies?.gestmoney_refresh;
    return this.authService.revokeAllSessions(userId, currentRefreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Révoquer une session spécifique' })
  @ApiResponse({ status: 200, description: 'Session révoquée' })
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.revokeSession(userId, sessionId);
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
  @ApiOperation({ summary: 'Vérifier et activer le code 2FA (lors du setup)' })
  @ApiResponse({ status: 200, description: '2FA activé avec succès + codes de secours' })
  async verify2FA(
    @CurrentUser('id') userId: string,
    @TenantId() tenantId: string,
    @Body() dto: Verify2FADto,
  ) {
    return this.authService.verify2FA(userId, tenantId, dto);
  }

  // Alias POST /auth/2fa/setup → génère secret + QR code (équiv. /2fa/enable)
  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Initialiser la 2FA — génère secret + QR code' })
  @ApiResponse({ status: 200, description: 'QR Code et secret TOTP' })
  async setup2FA(@CurrentUser('id') userId: string) {
    return this.authService.enable2FA(userId);
  }

  // POST /auth/2fa/activer → alias de verify (confirme le setup + retourne codes de secours)
  @UseGuards(JwtAuthGuard)
  @Post('2fa/activer')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Confirmer l\'activation 2FA avec le code TOTP' })
  @ApiResponse({ status: 200, description: '2FA activée + codes de secours' })
  async activer2FA(
    @CurrentUser('id') userId: string,
    @TenantId() tenantId: string,
    @Body() dto: Verify2FADto,
  ) {
    return this.authService.verify2FA(userId, tenantId, dto);
  }

  // POST /auth/2fa/desactiver → désactive la 2FA (mot de passe requis)
  @UseGuards(JwtAuthGuard)
  @Post('2fa/desactiver')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Désactiver la 2FA (mot de passe requis)' })
  @ApiResponse({ status: 200, description: '2FA désactivée' })
  async desactiver2FA(
    @CurrentUser('id') userId: string,
    @TenantId() tenantId: string,
    @Body() dto: Desactiver2FADto,
  ) {
    return this.authService.desactiver2FA(userId, tenantId, dto.motDePasse);
  }

  // POST /auth/2fa/login-verify → 2ème étape login quand requires2FA=true
  @Public()
  @Post('2fa/login-verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compléter le login avec le code 2FA (2ème étape)' })
  @ApiResponse({ status: 200, description: 'Connexion complète — tokens définis en cookie' })
  async loginVerify2FA(
    @Body() dto: LoginVerify2FADto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.loginAvec2FA(dto.tempToken, dto.code);
    if ('accessToken' in result && result.accessToken) {
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
    }
    const { accessToken, refreshToken, ...safe } = result as any;
    return safe;
  }

  // ─── Impersonation ───────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('impersonate')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Démarrer une session d\'impersonation (SUPER_ADMIN uniquement)' })
  @ApiBody({ schema: { properties: { targetUserId: { type: 'string' }, raison: { type: 'string', minLength: 10 } } } })
  @ApiResponse({ status: 201, description: 'Session démarrée, token court retourné' })
  @ApiResponse({ status: 403, description: 'Accès refusé — SUPER_ADMIN requis' })
  async startImpersonation(
    @CurrentUser('id') superAdminId: string,
    @CurrentUser('roles') roles: string[],
    @Body() dto: StartImpersonationDto,
    @Request() req: any,
  ) {
    if (!roles?.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Seul un SUPER_ADMIN peut impersonner');
    }
    const ip = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0';
    return this.authService.startImpersonation(superAdminId, dto.targetUserId, dto.raison, ip);
  }

  @UseGuards(JwtAuthGuard)
  @Post('impersonate/:sessionId/stop')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Terminer une session d\'impersonation' })
  @ApiResponse({ status: 200, description: 'Session terminée' })
  async stopImpersonation(
    @CurrentUser('id') superAdminId: string,
    @CurrentUser('roles') roles: string[],
    @Param('sessionId') sessionId: string,
  ) {
    if (!roles?.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Seul un SUPER_ADMIN peut arrêter une impersonation');
    }
    return this.authService.stopImpersonation(sessionId, superAdminId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('impersonate/sessions')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lister les sessions d\'impersonation actives (SUPER_ADMIN)' })
  @ApiResponse({ status: 200, description: 'Liste des sessions actives' })
  async listImpersonateSessions(
    @CurrentUser('id') superAdminId: string,
    @CurrentUser('roles') roles: string[],
  ) {
    if (!roles?.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Accès refusé');
    }
    return this.authService.listImpersonationSessions(superAdminId);
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
