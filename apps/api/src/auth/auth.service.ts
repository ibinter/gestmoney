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
// otplib v13 : API fonctionnelle (l'ancien objet `authenticator` de la v12
// n'existe plus). generateSecret/generateURI/verifySync remplacent
// authenticator.generateSecret/keyuri/verify.
import { generateSecret, generateURI, verifySync } from 'otplib';
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
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notifications: NotificationsService,
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
      // Pas de code fourni → retourner un token temporaire (5 min, flag pending2FA)
      const tempPayload = { sub: user.id, email: user.email, tenantId: resolvedTenantId, pending2FA: true };
      const tempToken = await this.jwtService.signAsync(tempPayload, {
        secret: this.configService.get('JWT_SECRET', 'gestmoney-super-secret-jwt-key-for-dev-32chars!'),
        expiresIn: '5m',
      });
      return { requires2FA: true, tempToken };
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
    // JAMAIS de repli vers un tenant littéral 'default' : risque de fuite
    // inter-établissement. Le tenant doit être fourni explicitement.
    const resolvedTenantId = tenantId || registerDto.tenantId;
    if (!resolvedTenantId) {
      throw new BadRequestException(
        "L'établissement (tenant) est requis pour l'inscription.",
      );
    }

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

    // Email de bienvenue au nouvel utilisateur
    void this.notifications.sendEmail({
      to: email,
      subject: 'Bienvenue sur GESTMONEY !',
      body: [
        `Bonjour ${firstName},`,
        '',
        'Votre compte GESTMONEY a été créé avec succès.',
        '',
        `Email    : ${email}`,
        `Espace   : ${resolvedTenantId}`,
        '',
        'Vous pouvez vous connecter dès maintenant :',
        'https://gestmoney.ibigsoft.com/login',
        '',
        'Si vous avez des questions, contactez notre support.',
        '',
        "L'équipe GESTMONEY — IBIG Soft",
      ].join('\n'),
      tenantId: resolvedTenantId,
    });

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

    // Envoi de l'email avec le lien de réinitialisation
    const appUrl =
      this.configService.get<string>('APP_URL') ?? 'https://gestmoney.ibigsoft.com';
    const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

    void this.notifications.sendEmail({
      to: dto.email,
      subject: 'Réinitialisation de votre mot de passe GESTMONEY',
      body: [
        `Bonjour ${user.firstName ?? ''},`,
        '',
        'Vous avez demandé la réinitialisation de votre mot de passe GESTMONEY.',
        'Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :',
        '',
        resetLink,
        '',
        'Ce lien est valide pendant 1 heure.',
        '',
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
        '',
        "L'équipe GESTMONEY — IBIG Soft",
      ].join('\n'),
      tenantId,
    });

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

  /**
   * Met à jour la photo de profil. L'image arrive en data URL base64 (JSON, pas
   * multipart — cf. UpdateAvatarDto) et est stockée telle quelle dans
   * `User.avatar` (petit fichier — évite tout service statique / modif nginx).
   * `image = null` supprime la photo.
   */
  async updateAvatar(userId: string, image: string | null) {
    let avatar: string | null = null;
    if (image) {
      const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(image.trim());
      if (!m) {
        throw new BadRequestException(
          'Image invalide : une data URL base64 (data:image/…;base64,…) est attendue.',
        );
      }
      const octets = Buffer.byteLength(m[2], 'base64');
      if (octets === 0) throw new BadRequestException('Image vide.');
      if (octets > 1_500_000) {
        throw new BadRequestException('Image trop volumineuse (max 1,5 Mo).');
      }
      avatar = image.trim();
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar },
      select: { id: true, avatar: true },
    });
    return { avatar: user.avatar };
  }

  // ─── Sessions actives ────────────────────────────────────────────────────────

  async getSessions(userId: string, currentRefreshToken?: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent ?? null,
      ipAddress: s.ipAddress ?? null,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: currentRefreshToken ? s.refreshToken === currentRefreshToken : false,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Session non trouvée');
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    return { message: 'Session révoquée' };
  }

  async revokeAllSessions(userId: string, currentRefreshToken?: string) {
    const where: Parameters<typeof this.prisma.session.updateMany>[0]['where'] = {
      userId,
      revokedAt: null,
    };
    if (currentRefreshToken) {
      (where as any).NOT = { refreshToken: currentRefreshToken };
    }
    await this.prisma.session.updateMany({ where, data: { revokedAt: new Date() } });
    return { message: 'Toutes les autres sessions ont été révoquées' };
  }

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

    const secret = generateSecret();
    const otpAuthUrl = generateURI({
      issuer: 'GESTMONEY',
      label: user.email,
      secret,
    });
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

    const isValid = verifySync({ token: dto.code, secret: user.twoFactorSecret }).valid;
    if (!isValid) throw new UnauthorizedException('Code 2FA invalide');

    // Générer 8 codes de secours et les hacher
    const plainCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
      Math.random().toString(36).substring(2, 6).toUpperCase(),
    );
    const hashedCodes = await Promise.all(
      plainCodes.map((c) => bcrypt.hash(c, 10)),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorVerifiedAt: new Date(),
        twoFactorBackupCodes: hashedCodes,
      },
    });

    await this.logAudit('UPDATE', userId, tenantId, 'users', { action: '2FA_ENABLED' });

    return { message: 'Authentification 2FA activée avec succès', backupCodes: plainCodes };
  }

  // ─── Désactivation 2FA ───────────────────────────────────────────────────────

  async desactiver2FA(userId: string, tenantId: string, motDePasse: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    if (!user.twoFactorEnabled) throw new BadRequestException('La 2FA n\'est pas activée');

    const isPasswordValid = await bcrypt.compare(motDePasse, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('Mot de passe incorrect');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
        twoFactorVerifiedAt: null,
      },
    });

    await this.logAudit('UPDATE', userId, tenantId, 'users', { action: '2FA_DISABLED' });

    return { message: '2FA désactivée avec succès' };
  }

  // ─── Vérification 2FA lors du login (2ème étape) ────────────────────────────

  async loginAvec2FA(tempToken: string, code: string) {
    // Décoder et vérifier le token temporaire
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(tempToken, {
        secret: this.configService.get('JWT_SECRET', 'gestmoney-super-secret-jwt-key-for-dev-32chars!'),
      });
    } catch {
      throw new UnauthorizedException('Token temporaire invalide ou expiré');
    }

    if (!payload.pending2FA) {
      throw new UnauthorizedException('Token non valide pour la vérification 2FA');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA non configurée pour cet utilisateur');
    }

    // Vérifier le code TOTP (window ±1)
    const isValidTotp = verifySync({ token: code, secret: user.twoFactorSecret }).valid;

    // Sinon, vérifier les codes de secours
    if (!isValidTotp) {
      const backupMatch = await Promise.all(
        user.twoFactorBackupCodes.map((h) => bcrypt.compare(code, h)),
      );
      const matchIndex = backupMatch.findIndex((m) => m);
      if (matchIndex === -1) {
        throw new UnauthorizedException('Code 2FA invalide');
      }
      // Invalider le code de secours utilisé (one-time)
      const updatedCodes = user.twoFactorBackupCodes.filter((_, i) => i !== matchIndex);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorBackupCodes: updatedCodes },
      });
    }

    // Réinitialiser les tentatives et générer les tokens complets
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const roles = user.userRoles.map((ur) => ur.role.name);
    const tokens = await this.generateTokens(user.id, user.email, user.tenantId, roles);
    await this.saveSession(user.id, user.tenantId, tokens.refreshToken);
    await this.logAudit('LOGIN', user.id, user.tenantId, 'users', { via: '2FA' });

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

  // ─── Impersonation ───────────────────────────────────────────────────────────

  async startImpersonation(
    superAdminId: string,
    targetUserId: string,
    raison: string,
    ip: string,
  ) {
    // 1. Vérifier que le demandeur est SUPER_ADMIN
    const admin = await this.prisma.user.findUnique({
      where: { id: superAdminId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!admin) throw new NotFoundException('Administrateur non trouvé');

    const isSuperAdmin = admin.userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN');
    if (!isSuperAdmin) {
      throw new UnauthorizedException('Seul un SUPER_ADMIN peut impersonner');
    }

    // 2. Vérifier que l'utilisateur cible existe
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!target) throw new NotFoundException('Utilisateur cible non trouvé');

    // Interdire d'impersonner un autre SUPER_ADMIN
    const targetIsSuperAdmin = target.userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN');
    if (targetIsSuperAdmin) {
      throw new BadRequestException('Impossible d\'impersonner un SUPER_ADMIN');
    }

    // 3. Créer la session d'impersonation
    const session = await this.prisma.impersonationSession.create({
      data: {
        superAdminId,
        targetUserId,
        targetTenantId: target.tenantId,
        raison,
        ipAddress: ip,
      },
    });

    // 4. Générer un JWT court (2h) avec champs d'impersonation
    const targetRoles = target.userRoles.map((ur) => ur.role.name);
    const payload = {
      sub: target.id,
      email: target.email,
      tenantId: target.tenantId,
      roles: targetRoles,
      impersonatedBy: superAdminId,
      impersonationId: session.id,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET', 'gestmoney-super-secret-jwt-key-for-dev-32chars!'),
      expiresIn: '2h',
    });

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    // 5. Logger dans AuditLog
    await this.logAudit('LOGIN', superAdminId, admin.tenantId || 'system', 'impersonation', {
      action: 'IMPERSONATION_START',
      targetUserId,
      targetTenantId: target.tenantId,
      sessionId: session.id,
      raison,
    });

    this.logger.warn(
      `IMPERSONATION_START: admin=${superAdminId} target=${targetUserId} session=${session.id}`,
    );

    return {
      token: accessToken,
      sessionId: session.id,
      expiresAt,
      targetUser: {
        id: target.id,
        email: target.email,
        firstName: target.firstName,
        lastName: target.lastName,
        tenantId: target.tenantId,
        roles: targetRoles,
      },
    };
  }

  async stopImpersonation(impersonationId: string, superAdminId: string) {
    const session = await this.prisma.impersonationSession.findUnique({
      where: { id: impersonationId },
    });

    if (!session) throw new NotFoundException('Session d\'impersonation non trouvée');
    if (session.superAdminId !== superAdminId) {
      throw new UnauthorizedException('Vous ne pouvez arrêter que vos propres sessions');
    }
    if (!session.actif) {
      return { message: 'Session déjà terminée' };
    }

    await this.prisma.impersonationSession.update({
      where: { id: impersonationId },
      data: { actif: false, terminatedAt: new Date() },
    });

    const admin = await this.prisma.user.findUnique({
      where: { id: superAdminId },
      select: { tenantId: true },
    });

    await this.logAudit('LOGOUT', superAdminId, admin?.tenantId || 'system', 'impersonation', {
      action: 'IMPERSONATION_END',
      sessionId: impersonationId,
      targetUserId: session.targetUserId,
    });

    this.logger.log(`IMPERSONATION_END: admin=${superAdminId} session=${impersonationId}`);

    return { message: 'Session d\'impersonation terminée' };
  }

  async listImpersonationSessions(superAdminId: string) {
    const sessions = await this.prisma.impersonationSession.findMany({
      where: { superAdminId, actif: true },
      orderBy: { createdAt: 'desc' },
    });

    // Enrichir avec les infos des utilisateurs cibles
    const enriched = await Promise.all(
      sessions.map(async (s) => {
        const target = await this.prisma.user.findUnique({
          where: { id: s.targetUserId },
          select: { firstName: true, lastName: true, email: true },
        });
        return { ...s, targetUser: target };
      }),
    );

    return enriched;
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
