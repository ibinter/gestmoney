import { Test, TestingModule } from '@nestjs/testing';
import { AlertesService } from './alertes.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PushService } from '../push/push.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
  configAlertes: {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
  alerteEmise: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
  },
  floatAccount: {
    findMany: jest.fn(),
  },
  tenant: {
    findMany: jest.fn(),
  },
};

const mockNotifications = {
  sendEmail: jest.fn().mockResolvedValue(undefined),
};

const mockPush = {
  sendToUser: jest.fn().mockResolvedValue(undefined),
  sendToTenant: jest.fn().mockResolvedValue(undefined),
  envoyerAuxAdmins: jest.fn().mockResolvedValue(undefined),
  envoyerAuxAgents: jest.fn().mockResolvedValue(undefined),
};

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-1';

const mockConfig = {
  id: 'cfg-1',
  tenantId: TENANT_ID,
  seuilFloatBas: 50_000,
  seuilVolumeTransaction: 500_000,
  alerteFloatInApp: true,
  alerteFloatEmail: false,
  alerteTransactionEmail: false,
  alerteExpirationJ7: true,
  alerteExpirationJ30: true,
  emailsAlerte: [],
};

const mockAlerte = {
  id: 'alerte-1',
  tenantId: TENANT_ID,
  type: 'FLOAT_BAS',
  titre: 'Float bas',
  detail: 'Agent agent-1 | Solde : 20 000 FCFA',
  severite: 'WARNING',
  lu: false,
  createdAt: new Date(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('AlertesService', () => {
  let service: AlertesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: PushService, useValue: mockPush },
      ],
    }).compile();

    service = module.get<AlertesService>(AlertesService);
  });

  // ─── getConfig() ────────────────────────────────────────────────────────────

  describe('getConfig()', () => {
    it('retourne la config existante du tenant', async () => {
      mockPrisma.configAlertes.findUnique.mockResolvedValue(mockConfig);

      const result = await service.getConfig(TENANT_ID);

      expect(result).toEqual(mockConfig);
      expect(mockPrisma.configAlertes.findUnique).toHaveBeenCalledWith({
        where: { tenantId: TENANT_ID },
      });
      expect(mockPrisma.configAlertes.create).not.toHaveBeenCalled();
    });

    it("cree une config par defaut si elle n'existe pas", async () => {
      mockPrisma.configAlertes.findUnique.mockResolvedValue(null);
      mockPrisma.configAlertes.create.mockResolvedValue(mockConfig);

      const result = await service.getConfig(TENANT_ID);

      expect(mockPrisma.configAlertes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: TENANT_ID }),
        }),
      );
      expect(result).toEqual(mockConfig);
    });
  });

  // ─── updateConfig() ─────────────────────────────────────────────────────────

  describe('updateConfig()', () => {
    it('met a jour les seuils via upsert', async () => {
      const dto = { seuilFloatBas: 100_000, seuilVolumeTransaction: 1_000_000 };
      mockPrisma.configAlertes.upsert.mockResolvedValue({ ...mockConfig, ...dto });

      const result = await service.updateConfig(TENANT_ID, dto as any);

      expect(mockPrisma.configAlertes.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: TENANT_ID },
          update: expect.objectContaining(dto),
          create: expect.objectContaining({ tenantId: TENANT_ID, ...dto }),
        }),
      );
      expect(result.seuilFloatBas).toBe(100_000);
    });
  });

  // ─── verifierFloatsBas() (cron) ─────────────────────────────────────────────

  describe('verifierFloatsBas()', () => {
    const mockFloatAccount = {
      agentId: 'agent-1',
      balance: 20_000, // < seuil 50 000
      agent: { firstName: 'Kouakou', lastName: 'Eric' },
      network: { name: 'Orange Money' },
    };

    it('cree une AlerteEmise si le float est inferieur au seuil', async () => {
      mockPrisma.configAlertes.findMany.mockResolvedValue([
        { ...mockConfig, tenant: { id: TENANT_ID } },
      ]);
      mockPrisma.floatAccount.findMany.mockResolvedValue([mockFloatAccount]);
      mockPrisma.alerteEmise.findFirst.mockResolvedValue(null); // pas de doublon
      mockPrisma.alerteEmise.create.mockResolvedValue(mockAlerte);

      await service.verifierFloatsBas();

      expect(mockPrisma.alerteEmise.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: TENANT_ID,
            type: 'FLOAT_BAS',
            severite: 'WARNING',
          }),
        }),
      );
    });

    it('ne cree pas d alerte si le float est superieur ou egal au seuil', async () => {
      mockPrisma.configAlertes.findMany.mockResolvedValue([
        { ...mockConfig, tenant: { id: TENANT_ID } },
      ]);
      // Aucun compte sous le seuil
      mockPrisma.floatAccount.findMany.mockResolvedValue([]);

      await service.verifierFloatsBas();

      expect(mockPrisma.alerteEmise.create).not.toHaveBeenCalled();
    });

    it('ne cree pas de doublon si une alerte a deja ete emise dans les 4 dernieres heures', async () => {
      mockPrisma.configAlertes.findMany.mockResolvedValue([
        { ...mockConfig, tenant: { id: TENANT_ID } },
      ]);
      mockPrisma.floatAccount.findMany.mockResolvedValue([mockFloatAccount]);
      // Alerte deja existante dans les 4 dernieres heures
      mockPrisma.alerteEmise.findFirst.mockResolvedValue(mockAlerte);

      await service.verifierFloatsBas();

      expect(mockPrisma.alerteEmise.create).not.toHaveBeenCalled();
    });
  });

  // ─── getAlertes() ───────────────────────────────────────────────────────────

  describe('getAlertes()', () => {
    it('retourne les alertes paginées du tenant', async () => {
      const alertes = [mockAlerte];
      mockPrisma.alerteEmise.findMany.mockResolvedValue(alertes);
      mockPrisma.alerteEmise.count.mockResolvedValue(1);

      const result = await service.getAlertes(TENANT_ID, { page: 1, limit: 10 });

      expect(result.alertes).toEqual(alertes);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(mockPrisma.alerteEmise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: TENANT_ID },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('filtre par statut lu quand le parametre est fourni', async () => {
      mockPrisma.alerteEmise.findMany.mockResolvedValue([]);
      mockPrisma.alerteEmise.count.mockResolvedValue(0);

      await service.getAlertes(TENANT_ID, { lu: false });

      expect(mockPrisma.alerteEmise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_ID, lu: false }),
        }),
      );
    });
  });

  // ─── marquerLue() ───────────────────────────────────────────────────────────

  describe('marquerLue()', () => {
    it('passe lu a true pour l alerte ciblee', async () => {
      mockPrisma.alerteEmise.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.marquerLue('alerte-1', TENANT_ID);

      expect(mockPrisma.alerteEmise.updateMany).toHaveBeenCalledWith({
        where: { id: 'alerte-1', tenantId: TENANT_ID },
        data: { lu: true },
      });
      expect(result).toEqual({ count: 1 });
    });
  });
});
