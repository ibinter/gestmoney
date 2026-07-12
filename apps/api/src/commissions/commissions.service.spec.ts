import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockPlanTaux = {
  id: 'plan-uuid-1',
  tenantId: 'tenant-1',
  nom: 'Grille Orange RETRAIT',
  operateur: 'ORANGE_MONEY',
  typeTransaction: 'RETRAIT',
  active: true,
  partAgent: 70,
  partReseau: 30,
  paliers: [
    { montantMin: 1, montantMax: 10000, taux: 1, montantFixe: null },
    { montantMin: 10001, montantMax: 100000, taux: 0.8, montantFixe: null },
    { montantMin: 100001, montantMax: null, taux: null, montantFixe: 1000 },
  ],
};

const mockPlanFixe = {
  ...mockPlanTaux,
  id: 'plan-uuid-2',
  paliers: [
    { montantMin: 1, montantMax: 500000, taux: null, montantFixe: 500 },
  ],
};

const mockCommission = {
  id: 'comm-uuid-1',
  tenantId: 'tenant-1',
  transactionId: 'txn-uuid-1',
  agentId: 'agent-uuid-1',
  agenceId: 'agence-uuid-1',
  operateur: 'ORANGE_MONEY',
  typeTransaction: 'RETRAIT',
  montantTransaction: 50000,
  montantCommission: 400,
  partAgent: 280,
  partReseau: 120,
  statut: 'DUE',
  createdAt: new Date(),
};

const mockPrisma = {
  commissionPlan: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  commission: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    groupBy: jest.fn(),
  },
  commissionPayment: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  transaction: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('CommissionsService', () => {
  let service: CommissionsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
  });

  // ─── calculateCommissionAmount() ─────────────────────────────────────────────

  describe('calculateCommissionAmount()', () => {
    it('devrait calculer une commission en pourcentage (palier taux)', async () => {
      mockPrisma.commissionPlan.findFirst.mockResolvedValue({
        ...mockPlanTaux,
        paliers: [{ montantMin: 1, montantMax: 10000, taux: 1, montantFixe: null }],
      });

      const result = await service.calculateCommissionAmount(
        5000,
        'RETRAIT',
        'ORANGE_MONEY',
        'tenant-1',
      );

      expect(result.total).toBe(50); // 5000 * 1/100
      expect(result.partAgent).toBe(35); // 70% de 50
      expect(result.partReseau).toBe(15); // 30% de 50
    });

    it('devrait calculer une commission montant fixe', async () => {
      mockPrisma.commissionPlan.findFirst.mockResolvedValue(mockPlanFixe);

      const result = await service.calculateCommissionAmount(
        200000,
        'RETRAIT',
        'ORANGE_MONEY',
        'tenant-1',
      );

      expect(result.total).toBe(500);
      expect(result.partAgent).toBe(350); // 70%
      expect(result.partReseau).toBe(150); // 30%
    });

    it('devrait appliquer le bon palier parmi plusieurs paliers', async () => {
      mockPrisma.commissionPlan.findFirst.mockResolvedValue({
        ...mockPlanTaux,
        paliers: [
          { montantMin: 1, montantMax: 10000, taux: 2, montantFixe: null },
          { montantMin: 10001, montantMax: 100000, taux: 1, montantFixe: null },
          { montantMin: 100001, montantMax: null, taux: 0.5, montantFixe: null },
        ],
      });

      const result = await service.calculateCommissionAmount(
        50000,
        'RETRAIT',
        'ORANGE_MONEY',
        'tenant-1',
      );

      // Palier 10001-100000 → 1% de 50000 = 500
      expect(result.total).toBe(500);
    });

    it('devrait retourner 0 si aucun plan trouvé pour cet opérateur', async () => {
      mockPrisma.commissionPlan.findFirst.mockResolvedValue(null);

      const result = await service.calculateCommissionAmount(
        50000,
        'RETRAIT',
        'WAVE',
        'tenant-1',
      );

      expect(result.total).toBe(0);
      expect(result.partAgent).toBe(0);
      expect(result.partReseau).toBe(0);
    });

    it('devrait retourner 0 si aucun palier ne correspond au montant', async () => {
      mockPrisma.commissionPlan.findFirst.mockResolvedValue({
        ...mockPlanTaux,
        paliers: [{ montantMin: 500000, montantMax: null, taux: 0.5, montantFixe: null }],
      });

      const result = await service.calculateCommissionAmount(
        100,
        'RETRAIT',
        'ORANGE_MONEY',
        'tenant-1',
      );

      expect(result.total).toBe(0);
    });
  });

  // ─── validatePayment() (batch) ────────────────────────────────────────────────

  describe('validatePayment()', () => {
    it('devrait valider un paiement batch de commissions DUE', async () => {
      mockPrisma.commission.findMany.mockResolvedValue([mockCommission]);
      mockPrisma.commissionPayment.create.mockResolvedValue({
        id: 'payment-uuid-1',
        montantTotal: 280,
        nombreCommissions: 1,
      });
      mockPrisma.commission.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.validatePayment(
        { commissionIds: ['comm-uuid-1'] },
        'tenant-1',
        'user-uuid-1',
      );

      expect(result.commissionsPayees).toBe(1);
      expect(result.montantTotal).toBe(280); // partAgent de la commission
    });

    it('devrait lever NotFoundException si aucune commission DUE trouvée', async () => {
      mockPrisma.commission.findMany.mockResolvedValue([]);

      await expect(
        service.validatePayment({ commissionIds: ['bad-id'] }, 'tenant-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
