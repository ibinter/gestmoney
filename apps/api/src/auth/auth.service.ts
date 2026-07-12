import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  Verify2FADto,
} from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ─── Login ───────────────────────────────────────────────────────────────────

  async login(loginDto: LoginDto, tenantId: string) {
    const { email, password, twoFactorCode } = loginDto;
    let resolvedTenantId = tenantId || loginDto.tenantId;

    // Si aucun tenant fourni, chercher l'utilisateur sans restriction de tenant
    const user = await this.prisma.user.findFirst({
      where: resolvedTenantId
        ? { email, tenantId: resolvedTenantId }
        : { email },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
      throw new UnauthorizedException('Compte désactivé. Contactez l\'administrateur');
    }

    // Vérifier si le compte est verrouillé
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      throw new UnauthorizedException(`Compte verrouillé jusqu'au ${user.lockedUntil.toLocaleString()}`);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Incrémenter les tentatives échouées
      const attempts = user.failedLoginAttempts + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          ...(lockUntil && { lockedUntil: lockUntil }),
        },
      });
      await this.logAudit('LOGIN', user.id, user.tenantId, 'users', { reason: 'WRONG_PASSWORD' });
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérification 2FA
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return { requiresTwoFactor: true, userId: user.id };
      }
      const isValidCode = authenticator.verify({
        token: twoFactorCode,
        secret: user.twoFactorSecret || '',
      });
      if (!isValidCode) {
        throw new UnauthorizedException('Code 2FA invalide');
      }
    }

    // Réinitialiser les tentatives
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const roles = user.userRoles.map((ur) => ur.role.name);
    const effectiveTenantId = user.tenantId;
    const tokens = await this.generateTokens(user.id, user.email, effectiveTenantId, roles);

    await this.saveSession(user.id, effectiveTenantId, tokens.refreshToken);
    await this.logAudit('LOGIN', user.id, effectiveTenantId, 'users', { email });

    this.logger.log(`Connexion réussie: ${email} [tenant:${effectiveTenantId}]`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        tenantId: user.tenantId,
        status: user.status,
      },
    };
  }

  // ─── Register ────────────────────────────────────────────────────────────────

  async register(registerDto: RegisterDto, tenantId: string) {
    const { email, password, firstName, lastName, phone, role } = registerDto;
    const resolvedTenantId = tenantId || registerDto.tenantId || 'default';

    const existingUser = await this.prisma.user.findFirst({
      where: { email, tenantId: resolvedTenantId },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà dans ce tenant');
    }

    const hashedPassword = await bcrypt.hash(password, this.BCRYPT_ROUNDS);

    const defaultRoleName = role || 'VIEWER';
    const userRole = await this.prisma.role.findFirst({
      where: { name: defaultRoleName, tenantId: resolvedTenantId },
    });

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        phone,
        tenantId: resolvedTenantId,
        status: 'ACTIVE',
        ...(userRole && {
          userRoles: {
            create: { roleId: userRole.id },
          },
        }),
      },
      include: { userRoles: { include: { role: true } } },
    });

    const roles = user.userRoles.map((ur) => ur.role.name);
    const tokens = await this.generateTokens(user.id, user.email, resolvedTenantId, roles);
    await this.saveSession(user.id, resolvedTenantId, tokens.refreshToken);

    await this.logAudit('CREATE', user.id, resolvedTenantId, 'users', { email });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        tenantId: user.tenantId,
      },
    };
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────

  async logout(userId: string, tenantId: string) {
    await this.prisma.session.updateMany({
      where: { userId, tenantId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.logAudit('LOGOUT', userId, tenantId, 'sessions', {});
    return { message: 'Déconnexion réussie' };
  }

  // ─── Refresh tokens ──────────────────────────────────────────────────────────

  async refreshTokens(userId: string, tenantId: string, refreshToken: string) {
    const session = await this.prisma.session.findFirst({
      where: { userId, refreshToken, revokedAt: null },
      include: {
        user: { include: { userRoles: { include: { role: true } } } },
      },
    });

    if (!session || new Date() > session.expiresAt) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    // Rotation: invalider l'ancienne session
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const { user } = session;
    const roles = user.userRoles.map((ur) => ur.role.name);
    const tokens = await this.generateTokens(user.id, user.email, tenantId, roles);
    await this.saveSession(user.id, tenantId, tokens.refreshToken);

    return tokens;
  }

  // ─── Forgot / Reset password ─────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId },
    });

    if (!user) {
      return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
    }

    // En production, envoyer par email - ici on stocke en session temporaire
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    // Stocker le token en session avec un préfixe spécial
    await this.prisma.session.create({
      data: {
        userId: user.id,
        tenantId,
        refreshToken: `RESET_${resetToken}`,
        expiresAt,
      },
    });

    this.logger.log(`Token reset créé pour ${dto.email} [tenant:${tenantId}]`);
    await this.logAudit('UPDATE', user.id, tenantId, 'users', { action: 'PASSWORD_RESET_REQUESTED' });

    return {
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
      ...(this.configService.get('nodeEnv') === 'development' && { resetToken }),
    };
  }

  async resetPassword(dto: ResetPasswordDto, tenantId: string) {
    const session = await this.prisma.session.findFirst({
      where: {
        refreshToken: `RESET_${dto.token}`,
        revokedAt: null,
      },
      include: { user: true },
    });

    if (!session || new Date() > session.expiresAt) {
      throw new BadRequestException('Token de réinitialisation invalide ou expiré');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: session.userId },
        data: {
          passwordHash: hashedPassword,
          status: 'ACTIVE',
          failedLoginAttempts: 0,
          lockedUntil: null,
          passwordChangedAt: new Date(),
        },
      }),
      this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      }),
      // Invalider toutes les autres sessions
      this.prisma.session.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.logAudit('UPDATE', session.userId, tenantId, 'users', { action: 'PASSWORD_RESET' });

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  // ─── Change password ─────────────────────────────────────────────────────────

  async changePassword(userId: string, tenantId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword, passwordChangedAt: new Date() },
    });

    // Invalider toutes les sessions (sauf courante idéalement)
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.logAudit('UPDATE', userId, tenantId, 'users', { action: 'PASSWORD_CHANGED' });

    return { message: 'Mot de passe modifié avec succès' };
  }

  // ─── Profil ──────────────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: { include: { rolePerms: { include: { permission: true } } } } } },
      },
    });

    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const { passwordHash, twoFactorSecret, ...profile } = user;
    return {
      ...profile,
      roles: user.userRoles.map((ur) => ur.role.name),
      permissions: [
        ...new Set(
          user.userRoles.flatMap((ur) =>
            ur.role.rolePerms.map((rp) => `${rp.permission.resource}:${rp.permission.action}`),
          ),
        ),
      ],
    };
  }

  // ─── 2FA ─────────────────────────────────────────────────────────────────────

  async enable2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    if (user.twoFactorEnabled) {
      throw new BadRequestException('L\'authentification 2FA est déjà activée');
    }

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, 'GESTMONEY', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return {
      secret,
      qrCode: qrCodeDataUrl,
      message: 'Scannez le QR code, puis confirmez avec le code généré',
    };
  }

  async verify2FA(userId: string, tenantId: string, dto: Verify2FADto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    if (!user.twoFactorSecret) throw new BadRequestException('2FA non initialisé');

    const isValid = authenticator.verify({ token: dto.code, secret: user.twoFactorSecret });
    if (!isValid) throw new UnauthorizedException('Code 2FA invalide');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorVerifiedAt: new Date(),
      },
    });

    await this.logAudit('UPDATE', userId, tenantId, 'users', { action: '2FA_ENABLED' });

    return { message: 'Authentification 2FA activée avec succès' };
  }

  // ─── Privé ───────────────────────────────────────────────────────────────────

  private async generateTokens(userId: string, email: string, tenantId: string, roles: string[]) {
    const payload: JwtPayload = { sub: userId, email, tenantId, roles };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET', 'gestmoney-super-secret-jwt-key-for-dev-32chars!'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET', 'gestmoney-refresh-secret-key-for-dev-32chars!'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveSession(userId: string, tenantId: string, refreshToken: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.create({
      data: { userId, tenantId, refreshToken, expiresAt },
    });
  }

  private async logAudit(
    action: string,
    userId: string,
    tenantId: string,
    resource: string,
    details: any,
  ) {
    try {
      // Mapper vers l'enum AuditAction du schéma
      const actionMap: Record<string, any> = {
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',
        CREATE: 'CREATE',
        UPDATE: 'UPDATE',
        DELETE: 'DELETE',
      };

      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: actionMap[action] || 'UPDATE',
          resource,
          description: JSON.stringify(details),
        },
      });
    } catch (error) {
      this.logger.warn(`AuditLog erreur: ${error.message}`);
    }
  }
}
