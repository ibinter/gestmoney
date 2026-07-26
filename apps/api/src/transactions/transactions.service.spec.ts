import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AgentNotFoundException,
  AgentSuspendedException,
  InsufficientFloatException,
  TransactionNotCancellableException,
  TransactionNotFoundException,
} from '../common/exceptions/business.exceptions';
import { ForbiddenException } from '@nestjs/common';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAgent = {
  id: 'agent-uuid-1',
  tenantId: 'tenant-1',
  nom: 'Kouakou',
  prenom: 'Eric',
  statut: 'ACTIF',
  agenceId: 'agence-uuid-1',
  limiteDailyMontant: null,
};

const mockFloatAccount = {
  id: 'float-uuid-1',
  agentId: 'agent-uuid-1',
  operatorCode: 'ORANGE_MONEY',
  balance: 100000,
  tenantId: 'tenant-1',
};

const mockTransaction = {
  id: 'txn-uuid-1',
  tenantId: 'tenant-1',
  reference: 'TXN-20260710-ABC123',
  type: 'DEPOT',
  status: 'PENDING',
  operateur: 'ORANGE_MONEY',
  montant: 50000,
  frais: 0,
  commission: 0,
  agentId: 'agent-uuid-1',
  agenceId: 'agence-uuid-1',
  clientPhone: '+22507XXXXXXXX',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  agent: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  floatAccount: {
    findFirst: jest.fn(),
  },
  network: {
    findUnique: jest.fn(),
  },
  customer: {
    updateMany: jest.fn(),
  },
  onboardingStep: {
    upsert: jest.fn().mockResolvedValue({}),
  },
  transaction: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

const mockEventEmitter = {
  emit: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: NotificationsService, useValue: { sendEmail: jest.fn(), creerInApp: jest.fn() } },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create()', () => {
    const dto = {
      montant: 50000,
      type: 'DEPOT' as const,
      operateur: 'ORANGE_MONEY' as const,
      agentId: 'agent-uuid-1',
      clientPhone: '+22507XXXXXXXX',
    };
    const tenantId = 'tenant-1';
    const userId = 'user-1';

    it('devrait créer une transaction DEPOT avec succès', async () => {
      mockPrisma.network.findUnique.mockResolvedValue({ id: 'network-1' });
      mockPrisma.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrisma.transaction.create.mockResolvedValue(mockTransaction);
      mockPrisma.auditLog.create.mockResolvedValue({});
      mockPrisma.transaction.aggregate.mockResolvedValue({ _sum: { montant: 0 } });

      const result = await service.create(dto, tenantId, userId);

      expect(result).toBeDefined();
      expect(result.type).toBe('DEPOT');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'transaction.created',
        expect.any(Object),
      );
    });

    it('devrait lever AgentNotFoundException si agent inexistant', async () => {
      mockPrisma.network.findUnique.mockResolvedValue({ id: 'network-1' });
      mockPrisma.agent.findFirst.mockResolvedValue(null);

      await expect(service.create(dto, tenantId, userId)).rejects.toThrow(
        AgentNotFoundException,
      );
    });

    it('devrait lever AgentSuspendedException si agent suspendu', async () => {
      // Le service lit le champ Prisma anglais `status` ('SUSPENDED'),
      // pas l'alias FR `statut`.
      mockPrisma.network.findUnique.mockResolvedValue({ id: 'network-1' });
      mockPrisma.agent.findFirst.mockResolvedValue({
        ...mockAgent,
        status: 'SUSPENDED',
      });

      await expect(service.create(dto, tenantId, userId)).rejects.toThrow(
        AgentSuspendedException,
      );
    });

    it('devrait vérifier le float pour un RETRAIT et lever InsufficientFloatException', async () => {
      mockPrisma.network.findUnique.mockResolvedValue({ id: 'network-1' });
      mockPrisma.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrisma.floatAccount.findFirst.mockResolvedValue({
        ...mockFloatAccount,
        balance: 10000, // insuffisant pour 50000
      });

      const retraitDto = { ...dto, type: 'RETRAIT' as const };
      await expect(service.create(retraitDto, tenantId, userId)).rejects.toThrow(
        InsufficientFloatException,
      );
    });

    it('devrait autoriser un RETRAIT si float suffisant', async () => {
      mockPrisma.network.findUnique.mockResolvedValue({ id: 'network-1' });
      mockPrisma.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrisma.floatAccount.findFirst.mockResolvedValue(mockFloatAccount);
      mockPrisma.transaction.aggregate.mockResolvedValue({ _sum: { montant: 0 } });
      mockPrisma.transaction.create.mockResolvedValue({
        ...mockTransaction,
        type: 'RETRAIT',
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const retraitDto = { ...dto, type: 'RETRAIT' as const };
      const result = await service.create(retraitDto, tenantId, userId);
      expect(result.type).toBe('RETRAIT');
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('devrait retourner la transaction si trouvée', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransaction);

      const result = await service.findOne('txn-uuid-1', 'tenant-1');
      expect(result.id).toBe('txn-uuid-1');
    });

    it('devrait lever TransactionNotFoundException si inexistante', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      await expect(service.findOne('bad-id', 'tenant-1')).rejects.toThrow(
        TransactionNotFoundException,
      );
    });
  });

  // ─── cancel ─────────────────────────────────────────────────────────────────

  describe('cancel()', () => {
    it('devrait annuler une transaction PENDING', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue({
        ...mockTransaction,
        status: 'CANCELLED',
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await service.cancel('txn-uuid-1', 'tenant-1', 'user-1');
      expect(result.status).toBe('CANCELLED');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'transaction.cancelled',
        expect.any(Object),
      );
    });

    it('devrait lever TransactionNotCancellableException si COMPLETED', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue({
        ...mockTransaction,
        status: 'COMPLETED',
      });

      await expect(
        service.cancel('txn-uuid-1', 'tenant-1', 'user-1'),
      ).rejects.toThrow(TransactionNotCancellableException);
    });
  });

  // ─── complete (valider) ──────────────────────────────────────────────────────

  describe('complete()', () => {
    const completedTx = {
      ...mockTransaction,
      status: 'COMPLETED',
      completedAt: new Date(),
      agentId: 'agent-uuid-1',
      receiverPhone: '+22507XXXXXXXX',
    };

    it('devrait passer le statut à COMPLETED (VALIDEE)', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue(completedTx);
      mockPrisma.agent.update.mockResolvedValue({});
      mockPrisma.customer.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await service.complete('txn-uuid-1', 'tenant-1', 'user-1');

      expect(result.status).toBe('COMPLETED');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'transaction.completed',
        expect.any(Object),
      );
    });

    it("devrait créer une entrée dans le journal d'audit lors de la validation", async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue(completedTx);
      mockPrisma.agent.update.mockResolvedValue({});
      mockPrisma.customer.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.auditLog.create.mockResolvedValue({});

      await service.complete('txn-uuid-1', 'tenant-1', 'user-1');

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UPDATE',
            resource: 'Transaction',
            resourceId: 'txn-uuid-1',
          }),
        }),
      );
    });

    it('devrait lever BadRequestException si la transaction est déjà COMPLETED', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue({
        ...mockTransaction,
        status: 'COMPLETED',
      });

      const { BadRequestException } = await import('@nestjs/common');
      await expect(
        service.complete('txn-uuid-1', 'tenant-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── isolation agence ────────────────────────────────────────────────────────

  describe('isolation agence', () => {
    const tenantId = 'tenant-1';

    it("un AGENT ne voit que les transactions de son agence (findAll forcé sur agencyId)", async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockPrisma.transaction.count.mockResolvedValue(0);

      await service.findAll({} as any, tenantId, 'agence-uuid-1');

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId, agencyId: 'agence-uuid-1' }),
        }),
      );
    });

    it("un NETWORK_ADMIN voit toutes les transactions (pas de filtre agencyId forcé)", async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockPrisma.transaction.count.mockResolvedValue(0);

      await service.findAll({} as any, tenantId); // pas d'agenceId

      const call = mockPrisma.transaction.findMany.mock.calls[0][0];
      expect(call.where).not.toHaveProperty('agencyId');
    });

    it("create rejette si l'agence du DTO ne correspond pas à l'agence de l'agent", async () => {
      const dto = {
        montant: 10000,
        type: 'DEPOT' as const,
        operateur: 'ORANGE_MONEY' as const,
        agentId: 'agent-uuid-1',
        clientPhone: '+22507XXXXXXXX',
        agencyId: 'autre-agence-uuid', // agence différente de celle de l'agent
      };

      await expect(
        service.create(dto as any, tenantId, 'user-1', 'agence-uuid-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── generateReference ───────────────────────────────────────────────────────

  describe('generateReference()', () => {
    it('devrait générer une référence au format TXN-YYYYMMDD-XXXXXX', () => {
      // Appel via réflexion (méthode privée)
      const ref = (service as any).generateReference();
      expect(ref).toMatch(/^TXN-\d{8}-[A-Z0-9]{6}$/);
    });

    it('devrait générer des références uniques', () => {
      const refs = new Set<string>();
      for (let i = 0; i < 100; i++) {
        refs.add((service as any).generateReference());
      }
      expect(refs.size).toBeGreaterThan(90); // très haute probabilité d'unicité
    });
  });

  // ─── calculateFrais ──────────────────────────────────────────────────────────

  describe('calculateFrais()', () => {
    it('devrait retourner 0 frais pour un DEPOT', () => {
      const frais = (service as any).calculateFrais(50000, 'DEPOT', 'ORANGE_MONEY');
      expect(frais).toBe(0);
    });

    it('devrait calculer 1% de frais pour un RETRAIT', () => {
      const frais = (service as any).calculateFrais(50000, 'RETRAIT', 'ORANGE_MONEY');
      expect(frais).toBe(500);
    });

    it('devrait calculer 2% de frais pour un TRANSFERT', () => {
      const frais = (service as any).calculateFrais(100000, 'TRANSFERT', 'MTN_MOMO');
      expect(frais).toBe(2000);
    });
  });
});
