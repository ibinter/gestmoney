import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FloatService } from './float.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  FloatAccountNotFoundException,
  InsufficientFloatException,
} from '../common/exceptions/business.exceptions';

// Le schéma Prisma est en anglais (`balance`, `minimumBalance`…) ; le service
// lit ces champs et ne connaît pas les alias FR. Les fixtures doivent donc
// refléter les noms réels lus par le code.
const mockFloatAccount = {
  id: 'float-uuid-1',
  agentId: 'agent-uuid-1',
  operateur: 'ORANGE_MONEY',
  balance: 100000,
  minimumBalance: 10000,
  maximumBalance: 200000,
  currency: 'XOF',
  tenantId: 'tenant-1',
};

const mockPrisma = {
  floatAccount: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    groupBy: jest.fn(),
  },
  floatMovement: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  replenishmentRequest: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

const mockEventEmitter = { emit: jest.fn() };

describe('FloatService', () => {
  let service: FloatService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FloatService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<FloatService>(FloatService);
  });

  // ─── debitFloat ──────────────────────────────────────────────────────────────

  describe('debitFloat()', () => {
    it('devrait débiter le float avec succès', async () => {
      mockPrisma.floatAccount.findFirst.mockResolvedValue(mockFloatAccount);
      mockPrisma.floatAccount.findUnique.mockResolvedValue({
        ...mockFloatAccount,
        balance: 50000, // après débit
      });
      mockPrisma.floatAccount.update.mockResolvedValue({});
      mockPrisma.floatMovement.create.mockResolvedValue({});

      await expect(
        service.debitFloat('agent-uuid-1', 'ORANGE_MONEY', 50000, 'tenant-1'),
      ).resolves.not.toThrow();

      expect(mockPrisma.floatAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ balance: { decrement: 50000 } }),
        }),
      );
    });

    it('devrait lever FloatAccountNotFoundException si compte inexistant', async () => {
      mockPrisma.floatAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.debitFloat('agent-uuid-1', 'ORANGE_MONEY', 50000, 'tenant-1'),
      ).rejects.toThrow(FloatAccountNotFoundException);
    });

    it('devrait lever InsufficientFloatException si solde insuffisant', async () => {
      mockPrisma.floatAccount.findFirst.mockResolvedValue({
        ...mockFloatAccount,
        balance: 1000,
      });

      await expect(
        service.debitFloat('agent-uuid-1', 'ORANGE_MONEY', 50000, 'tenant-1'),
      ).rejects.toThrow(InsufficientFloatException);
    });

    it('devrait émettre un event LOW_BALANCE_ALERT si solde passe sous le seuil', async () => {
      mockPrisma.floatAccount.findFirst.mockResolvedValue(mockFloatAccount);
      mockPrisma.floatAccount.update.mockResolvedValue({});
      mockPrisma.floatMovement.create.mockResolvedValue({});
      // Solde après débit = 5000 (< minimumBalance 10000)
      mockPrisma.floatAccount.findUnique.mockResolvedValue({
        ...mockFloatAccount,
        balance: 5000,
      });

      await service.debitFloat('agent-uuid-1', 'ORANGE_MONEY', 95000, 'tenant-1');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'float.low_balance_alert',
        expect.objectContaining({ agentId: 'agent-uuid-1', operateur: 'ORANGE_MONEY' }),
      );
    });
  });

  // ─── creditFloat ─────────────────────────────────────────────────────────────

  describe('creditFloat()', () => {
    it('devrait créditer le float avec succès', async () => {
      mockPrisma.floatAccount.findFirst.mockResolvedValue(mockFloatAccount);
      mockPrisma.floatAccount.update.mockResolvedValue({});
      mockPrisma.floatMovement.create.mockResolvedValue({});

      await expect(
        service.creditFloat('agent-uuid-1', 'ORANGE_MONEY', 50000, 'tenant-1'),
      ).resolves.not.toThrow();

      expect(mockPrisma.floatAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ balance: { increment: 50000 } }),
        }),
      );
    });
  });

  // ─── getAlerts ────────────────────────────────────────────────────────────────

  describe('getAlerts()', () => {
    it('devrait retourner les comptes sous seuil', async () => {
      mockPrisma.floatAccount.findMany.mockResolvedValue([
        { ...mockFloatAccount, balance: 5000, agent: { agentCode: 'AG-1', agencyId: 'a1' } },
        { ...mockFloatAccount, id: 'f2', balance: 50000, agent: { agentCode: 'AG-2', agencyId: 'a1' } },
      ]);

      const alerts = await service.getAlerts('tenant-1');

      // Seul le premier (balance 5000 < minimumBalance 10000) doit être dans les alertes
      expect(alerts).toHaveLength(1);
      expect(alerts[0].solde).toBe(5000);
      expect(alerts[0].niveau).toBe('BAS');
    });

    it('devrait marquer CRITIQUE si solde = 0', async () => {
      mockPrisma.floatAccount.findMany.mockResolvedValue([
        { ...mockFloatAccount, balance: 0, agent: { agentCode: 'AG-1', agencyId: 'a1' } },
      ]);

      const alerts = await service.getAlerts('tenant-1');
      expect(alerts[0].niveau).toBe('CRITIQUE');
    });
  });

  // ─── getForecast ─────────────────────────────────────────────────────────────

  describe('getForecast()', () => {
    it('devrait calculer les prévisions basées sur 7 jours', async () => {
      mockPrisma.floatMovement.groupBy.mockResolvedValue([
        {
          floatAccountId: 'float-uuid-1',
          _sum: { amount: 700000 }, // 100k/jour
        },
      ]);

      mockPrisma.floatAccount.findMany.mockResolvedValue([
        { ...mockFloatAccount, balance: 150000 },
      ]);

      const forecast = await service.getForecast('tenant-1');

      expect(forecast).toHaveLength(1);
      expect(forecast[0].moyenneConsommationJournaliere).toBe(100000);
      expect(forecast[0].joursAvantEpuisement).toBe(1); // 150000 / 100000 = 1.5 → floor = 1
    });

    it('devrait retourner priorité URGENTE si <= 1 jour', async () => {
      mockPrisma.floatMovement.groupBy.mockResolvedValue([
        {
          floatAccountId: 'float-uuid-1',
          _sum: { amount: 700000 },
        },
      ]);

      mockPrisma.floatAccount.findMany.mockResolvedValue([
        { ...mockFloatAccount, balance: 50000 }, // 50000 / 100000/j < 1 jour
      ]);

      const forecast = await service.getForecast('tenant-1');
      expect(forecast[0].priorite).toBe('URGENTE');
    });

    it('devrait retourner priorite NORMALE si > 3 jours', async () => {
      mockPrisma.floatMovement.groupBy.mockResolvedValue([]);
      mockPrisma.floatAccount.findMany.mockResolvedValue([
        { ...mockFloatAccount, balance: 500000 },
      ]);

      const forecast = await service.getForecast('tenant-1');
      // Aucun mouvement = consommation 0 = 999 jours
      expect(forecast[0].priorite).toBe('NORMALE');
    });
  });
});
