import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Mocks globaux ────────────────────────────────────────────────────────────

jest.mock('bcrypt');
jest.mock('otplib');

const mockUser = {
  id: 'user-uuid-1',
  email: 'agent@ibigsoft.ci',
  passwordHash: '$2b$12$hashedpassword',
  firstName: 'Kouakou',
  lastName: 'Eric',
  phone: '+22507000000',
  status: 'ACTIVE',
  tenantId: 'tenant-1',
  twoFactorEnabled: false,
  twoFactorSecret: null,
  failedLoginAttempts: 0,
  lockedUntil: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  userRoles: [{ role: { name: 'AGENT' } }],
};

const mockSession = {
  id: 'session-uuid-1',
  userId: 'user-uuid-1',
  tenantId: 'tenant-1',
  refreshToken: 'valid-refresh-token',
  expiresAt: new Date(Date.now() + 7 * 86400000),
  revokedAt: null,
  user: {
    ...mockUser,
    userRoles: [{ role: { name: 'AGENT' } }],
  },
};

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  role: {
    findFirst: jest.fn(),
  },
  session: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn((ops) => Promise.all(ops)),
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
};

const mockConfigService = {
  get: jest.fn((key: string, defaultVal?: any) => defaultVal ?? 'test-value'),
};

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ─── login() ────────────────────────────────────────────────────────────────

  describe('login()', () => {
    const loginDto = {
      email: 'agent@ibigsoft.ci',
      password: 'Password123!',
    };
    const tenantId = 'tenant-1';

    it('devrait retourner les tokens pour des credentials valides', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockPrisma.session.create.mockResolvedValue({ id: 'session-1' });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await service.login(loginDto, tenantId);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('devrait lever UnauthorizedException pour un mot de passe incorrect', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      await expect(service.login(loginDto, tenantId)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("devrait lever UnauthorizedException si l'utilisateur n'existe pas", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.login(loginDto, tenantId)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('devrait lever UnauthorizedException si le compte est INACTIVE', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        status: 'INACTIVE',
      });

      await expect(service.login(loginDto, tenantId)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('devrait lever UnauthorizedException si le compte est SUSPENDED', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        status: 'SUSPENDED',
      });

      await expect(service.login(loginDto, tenantId)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('devrait retourner requiresTwoFactor=true si 2FA activé et code absent', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'TOTP_SECRET_123',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto, tenantId);

      expect(result).toHaveProperty('requiresTwoFactor', true);
      expect(result).toHaveProperty('userId', mockUser.id);
    });

    it('devrait lever UnauthorizedException si le compte est verrouillé', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000), // verrouillé 10 min
      });

      await expect(service.login(loginDto, tenantId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── refreshTokens() ────────────────────────────────────────────────────────

  describe('refreshTokens()', () => {
    it('devrait retourner de nouveaux tokens pour un refresh token valide', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(mockSession);
      mockPrisma.session.update.mockResolvedValue({});
      mockPrisma.session.create.mockResolvedValue({});

      const result = await service.refreshTokens('user-uuid-1', 'tenant-1', 'valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('devrait lever UnauthorizedException pour un token expiré', async () => {
      mockPrisma.session.findFirst.mockResolvedValue({
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000), // expiré
      });

      await expect(
        service.refreshTokens('user-uuid-1', 'tenant-1', 'expired-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('devrait lever UnauthorizedException pour un token révoqué (introuvable)', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(null);

      await expect(
        service.refreshTokens('user-uuid-1', 'tenant-1', 'revoked-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── register() ─────────────────────────────────────────────────────────────

  describe('register()', () => {
    const registerDto = {
      email: 'nouveau@ibigsoft.ci',
      password: 'Password123!',
      firstName: 'Nouveau',
      lastName: 'Agent',
      phone: '+22507111111',
    };
    const tenantId = 'tenant-1';

    it("devrait créer un nouvel utilisateur et retourner les tokens", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$newhash');
      mockPrisma.role.findFirst.mockResolvedValue({ id: 'role-1', name: 'VIEWER' });
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        userRoles: [{ role: { name: 'VIEWER' } }],
      });
      mockPrisma.session.create.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await service.register(registerDto, tenantId);

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe(registerDto.email);
    });

    it("devrait lever ConflictException si l'email est déjà utilisé", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(service.register(registerDto, tenantId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── verify2FA() ─────────────────────────────────────────────────────────────

  describe('verify2FA()', () => {
    const dto = { code: '123456' };

    it('devrait valider un code TOTP correct et activer la 2FA', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: 'SECRET',
        twoFactorEnabled: false,
      });
      (authenticator.verify as jest.Mock).mockReturnValue(true);
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await service.verify2FA('user-uuid-1', 'tenant-1', dto);

      expect(result.message).toContain('activée');
    });

    it('devrait lever UnauthorizedException pour un code TOTP invalide', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: 'SECRET',
      });
      (authenticator.verify as jest.Mock).mockReturnValue(false);

      await expect(
        service.verify2FA('user-uuid-1', 'tenant-1', dto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
