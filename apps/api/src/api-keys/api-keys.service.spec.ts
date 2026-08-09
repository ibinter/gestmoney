import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../prisma/prisma.service';
import { LicencesService } from '../licences/licences.service';

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const mockPrisma = {
  apiKey: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

// Par défaut le tenant est sur un palier payant (accès API autorisé).
const mockLicences = {
  getStatutLicenceCache: jest.fn(async () => ({ statut: 'ACTIVE' })),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TENANT = 'tenant-1';
const USER_ID = 'user-1';
const KEY_ID = 'apikey-1';

function sha256(str: string): string {
  return createHash('sha256').update(str).digest('hex');
}

function buildMockApiKey(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: KEY_ID,
    tenantId: TENANT,
    nom: 'Clé test',
    keyHash: sha256('gm_live_testkey'),
    prefix: 'gm_live_testke',
    permissions: ['transactions:read'],
    expiresAt: null,
    ipWhitelist: [],
    actif: true,
    createdBy: USER_ID,
    lastUsedAt: null,
    nbAppels: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    revokedAt: null,
    ...overrides,
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('ApiKeysService', () => {
  let service: ApiKeysService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: LicencesService, useValue: mockLicences },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
  });

  // ─── generer ────────────────────────────────────────────────────────────────

  describe('generer()', () => {
    it('retourne une clé avec le préfixe "gm_live_"', async () => {
      mockPrisma.apiKey.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...buildMockApiKey(), keyHash: data.keyHash, prefix: data.prefix }),
      );

      const result = await service.generer(TENANT, USER_ID, {
        nom: 'Clé test',
        permissions: ['transactions:read'],
      });

      expect(result.key).toMatch(/^gm_live_/);
    });

    it('stocke le hash SHA-256 de la clé, jamais la clé en clair', async () => {
      let storedHash = '';
      mockPrisma.apiKey.create.mockImplementation(({ data }: any) => {
        storedHash = data.keyHash;
        return Promise.resolve({ ...buildMockApiKey(), keyHash: data.keyHash });
      });

      const result = await service.generer(TENANT, USER_ID, {
        nom: 'Clé sécurisée',
        permissions: [],
      });

      const expectedHash = sha256(result.key);
      expect(storedHash).toBe(expectedHash);
      // La valeur stockée ne doit pas être la clé en clair
      expect(storedHash).not.toBe(result.key);
    });

    it('la clé en clair ne figure pas dans apiKey retourné (keyHash absent)', async () => {
      mockPrisma.apiKey.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...buildMockApiKey(), keyHash: data.keyHash }),
      );

      const result = await service.generer(TENANT, USER_ID, {
        nom: 'Clé test',
        permissions: [],
      });

      // apiKey ne doit pas contenir keyHash
      expect((result.apiKey as any).keyHash).toBeUndefined();
    });

    it('keyHash !== rawKey (le hash est différent de la clé brute)', async () => {
      let capturedHash = '';
      mockPrisma.apiKey.create.mockImplementation(({ data }: any) => {
        capturedHash = data.keyHash;
        return Promise.resolve({ ...buildMockApiKey(), keyHash: data.keyHash });
      });

      const result = await service.generer(TENANT, USER_ID, {
        nom: 'Clé',
        permissions: [],
      });

      expect(capturedHash).not.toBe(result.key);
    });

    it("crée la clé avec les métadonnées fournies (nom, permissions, expiresAt)", async () => {
      const expiresAt = '2027-12-31T23:59:59Z';
      mockPrisma.apiKey.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...buildMockApiKey(), ...data }),
      );

      const result = await service.generer(TENANT, USER_ID, {
        nom: 'Clé prod',
        permissions: ['transactions:write'],
        expiresAt,
      });

      expect(mockPrisma.apiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nom: 'Clé prod',
            permissions: ['transactions:write'],
          }),
        }),
      );
      expect(result.key).toMatch(/^gm_live_/);
    });
  });

  // ─── valider ────────────────────────────────────────────────────────────────

  describe('valider()', () => {
    it('retourne les métadonnées de la clé si correcte, active et non expirée', async () => {
      const rawKey = 'gm_live_' + 'a'.repeat(32);
      const apiKey = buildMockApiKey({ keyHash: sha256(rawKey), actif: true, expiresAt: null });
      mockPrisma.apiKey.findUnique.mockResolvedValue(apiKey);
      mockPrisma.apiKey.update.mockResolvedValue({});

      const result = await service.valider(rawKey);

      expect(result).not.toBeNull();
      expect((result as any).keyHash).toBeUndefined();
    });

    it('retourne null si la clé est incorrecte (introuvable en base)', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);

      const result = await service.valider('gm_live_' + 'b'.repeat(32));

      expect(result).toBeNull();
    });

    it('retourne null si la clé est expirée', async () => {
      const rawKey = 'gm_live_' + 'c'.repeat(32);
      const apiKey = buildMockApiKey({
        keyHash: sha256(rawKey),
        actif: true,
        expiresAt: new Date(Date.now() - 60000), // expirée il y a 1 min
      });
      mockPrisma.apiKey.findUnique.mockResolvedValue(apiKey);

      const result = await service.valider(rawKey);

      expect(result).toBeNull();
    });

    it("retourne null si la clé n'a pas le préfixe gm_live_", async () => {
      const result = await service.valider('sk_live_not_valid_prefix');

      expect(result).toBeNull();
      expect(mockPrisma.apiKey.findUnique).not.toHaveBeenCalled();
    });

    it("retourne null si l'IP n'est pas dans la whitelist", async () => {
      const rawKey = 'gm_live_' + 'd'.repeat(32);
      const apiKey = buildMockApiKey({
        keyHash: sha256(rawKey),
        actif: true,
        expiresAt: null,
        ipWhitelist: ['192.168.1.1'],
      });
      mockPrisma.apiKey.findUnique.mockResolvedValue(apiKey);

      const result = await service.valider(rawKey, '10.0.0.1');

      expect(result).toBeNull();
    });

    it("autorise l'accès si l'IP est dans la whitelist", async () => {
      const rawKey = 'gm_live_' + 'e'.repeat(32);
      const apiKey = buildMockApiKey({
        keyHash: sha256(rawKey),
        actif: true,
        expiresAt: null,
        ipWhitelist: ['192.168.1.1'],
      });
      mockPrisma.apiKey.findUnique.mockResolvedValue(apiKey);
      mockPrisma.apiKey.update.mockResolvedValue({});

      const result = await service.valider(rawKey, '192.168.1.1');

      expect(result).not.toBeNull();
    });

    it('retourne null si la clé est révoquée (actif=false)', async () => {
      const rawKey = 'gm_live_' + 'f'.repeat(32);
      const apiKey = buildMockApiKey({
        keyHash: sha256(rawKey),
        actif: false,
      });
      mockPrisma.apiKey.findUnique.mockResolvedValue(apiKey);

      const result = await service.valider(rawKey);

      expect(result).toBeNull();
    });

    it("autorise l'accès si la whitelist est vide (aucune restriction IP)", async () => {
      const rawKey = 'gm_live_' + 'g'.repeat(32);
      const apiKey = buildMockApiKey({
        keyHash: sha256(rawKey),
        actif: true,
        expiresAt: null,
        ipWhitelist: [],
      });
      mockPrisma.apiKey.findUnique.mockResolvedValue(apiKey);
      mockPrisma.apiKey.update.mockResolvedValue({});

      const result = await service.valider(rawKey, '1.2.3.4');

      expect(result).not.toBeNull();
    });
  });

  // ─── revoquer ───────────────────────────────────────────────────────────────

  describe('revoquer()', () => {
    it('passe actif à false et enregistre revokedAt', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(buildMockApiKey());
      mockPrisma.apiKey.update.mockResolvedValue({});

      await service.revoquer(KEY_ID, TENANT);

      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: KEY_ID },
          data: expect.objectContaining({ actif: false, revokedAt: expect.any(Date) }),
        }),
      );
    });

    it('lève NotFoundException si la clé est introuvable', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null);

      await expect(service.revoquer('inexistant', TENANT)).rejects.toThrow(NotFoundException);
    });

    it('lève ForbiddenException si la clé appartient à un autre tenant', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(buildMockApiKey({ tenantId: 'autre-tenant' }));

      await expect(service.revoquer(KEY_ID, TENANT)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── lister ─────────────────────────────────────────────────────────────────

  describe('lister()', () => {
    it('ne retourne jamais le champ keyHash dans les résultats', async () => {
      const keys = [
        buildMockApiKey({ id: 'k1' }),
        buildMockApiKey({ id: 'k2' }),
      ];
      mockPrisma.apiKey.findMany.mockResolvedValue(keys);

      const result = await service.lister(TENANT);

      result.forEach((k) => {
        expect((k as any).keyHash).toBeUndefined();
      });
    });

    it('retourne toutes les clés du tenant triées par date décroissante', async () => {
      const keys = [buildMockApiKey({ id: 'k1' }), buildMockApiKey({ id: 'k2' })];
      mockPrisma.apiKey.findMany.mockResolvedValue(keys);

      const result = await service.lister(TENANT);

      expect(result).toHaveLength(2);
      expect(mockPrisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: TENANT },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('retourne un tableau vide si aucune clé pour le tenant', async () => {
      mockPrisma.apiKey.findMany.mockResolvedValue([]);

      const result = await service.lister(TENANT);

      expect(result).toEqual([]);
    });
  });
});
