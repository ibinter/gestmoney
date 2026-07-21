import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Fixtures (schéma RÉEL : plan → rates, network, earnings, payments) ─────────

const network = {
  id: 'net-1',
  tenantId: 'tenant-1',
  operatorCode: 'ORANGE_MONEY',
  currency: 'XOF',
};

/** Construit une grille avec ses paliers (CommissionRate) réels. */
function planAvecRates(rates: any[]) {
  return {
    id: 'plan-1',
    tenantId: 'tenant-1',
    name: 'Grille Orange RETRAIT',
    networkId: 'net-1',
    isActive: true,
    effectiveFrom: new Date('2020-01-01'),
    effectiveTo: null,
    rates: rates.map((r, i) => ({
      id: `rate-${i}`,
      transactionType: 'RETRAIT',
      minAmount: r.minAmount,
      maxAmount: r.maxAmount,
      rate: r.rate ?? 0,
      fixedAmount: r.fixedAmount ?? null,
      agentShare: 70,
      superAgentShare: 0,
      agencyShare: 0,
      networkShare: 30,
    })),
  };
}

const earning = {
  id: 'earn-1',
  tenantId: 'tenant-1',
  transactionId: 'txn-1',
  agentId: 'agent-1',
  agentAmount: 280,
};

const mockPrisma: any = {
  network: { findUnique: jest.fn() },
  commissionPlan: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  commissionRate: { create: jest.fn() },
  commissionEarning: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
  },
  commissionPayment: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  transaction: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  // $transaction(array) → résout toutes les promesses passées.
  $transaction: jest.fn((arg: any) =>
    Array.isArray(arg) ? Promise.all(arg) : arg(mockPrisma),
  ),
};

describe('CommissionsService', () => {
  let service: CommissionsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.network.findUnique.mockResolvedValue(network);

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
      mockPrisma.commissionPlan.findFirst.mockResolvedValue(
        planAvecRates([{ minAmount: 1, maxAmount: 10000, rate: 1 }]),
      );

      const result = await service.calculateCommissionAmount(
        5000,
        'RETRAIT' as any,
        'ORANGE_MONEY' as any,
        'tenant-1',
      );

      expect(result.total).toBe(50); // 5000 * 1/100
      expect(result.partAgent).toBe(35); // 70% de 50
      expect(result.partReseau).toBe(15); // 30% de 50
    });

    it('devrait calculer une commission montant fixe', async () => {
      mockPrisma.commissionPlan.findFirst.mockResolvedValue(
        planAvecRates([{ minAmount: 1, maxAmount: 500000, fixedAmount: 500 }]),
      );

      const result = await service.calculateCommissionAmount(
        200000,
        'RETRAIT' as any,
        'ORANGE_MONEY' as any,
        'tenant-1',
      );

      expect(result.total).toBe(500);
      expect(result.partAgent).toBe(350); // 70%
      expect(result.partReseau).toBe(150); // 30%
    });

    it('devrait appliquer le bon palier parmi plusieurs paliers', async () => {
      mockPrisma.commissionPlan.findFirst.mockResolvedValue(
        planAvecRates([
          { minAmount: 1, maxAmount: 10000, rate: 2 },
          { minAmount: 10001, maxAmount: 100000, rate: 1 },
          { minAmount: 100001, maxAmount: null, rate: 0.5 },
        ]),
      );

      const result = await service.calculateCommissionAmount(
        50000,
        'RETRAIT' as any,
        'ORANGE_MONEY' as any,
        'tenant-1',
      );

      // Palier 10001-100000 → 1% de 50000 = 500
      expect(result.total).toBe(500);
    });

    it("devrait retourner 0 si aucun réseau/plan trouvé pour l'opérateur", async () => {
      mockPrisma.commissionPlan.findFirst.mockResolvedValue(null);

      const result = await service.calculateCommissionAmount(
        50000,
        'RETRAIT' as any,
        'WAVE' as any,
        'tenant-1',
      );

      expect(result.total).toBe(0);
      expect(result.partAgent).toBe(0);
      expect(result.partReseau).toBe(0);
    });

    it('devrait retourner 0 si aucun palier ne correspond au montant', async () => {
      mockPrisma.commissionPlan.findFirst.mockResolvedValue(
        planAvecRates([{ minAmount: 500000, maxAmount: null, rate: 0.5 }]),
      );

      const result = await service.calculateCommissionAmount(
        100,
        'RETRAIT' as any,
        'ORANGE_MONEY' as any,
        'tenant-1',
      );

      expect(result.total).toBe(0);
    });
  });

  // ─── recordCommission() ──────────────────────────────────────────────────────

  describe('recordCommission()', () => {
    it("devrait créer un CommissionEarning et refléter la commission sur la transaction", async () => {
      mockPrisma.commissionEarning.findFirst.mockResolvedValue(null);
      mockPrisma.transaction.findUnique.mockResolvedValue({
        id: 'txn-1',
        tenantId: 'tenant-1',
        networkId: 'net-1',
        type: 'RETRAIT',
        amount: 50000,
        agentId: 'agent-1',
        agencyId: 'agence-1',
        createdAt: new Date('2026-07-01'),
      });
      mockPrisma.commissionPlan.findFirst.mockResolvedValue(
        planAvecRates([{ minAmount: 1, maxAmount: 100000, rate: 1 }]),
      );
      mockPrisma.commissionEarning.create.mockResolvedValue({ id: 'earn-1' });
      mockPrisma.transaction.update.mockResolvedValue({ id: 'txn-1' });

      await service.recordCommission('txn-1');

      expect(mockPrisma.commissionEarning.create).toHaveBeenCalledTimes(1);
      const data = mockPrisma.commissionEarning.create.mock.calls[0][0].data;
      expect(data.grossAmount).toBe(500); // 1% de 50000
      expect(data.agentAmount).toBe(350); // 70%
      expect(data.periodMonth).toBe(7);
      expect(data.periodYear).toBe(2026);
      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 'txn-1' },
        data: { commission: 500 },
      });
    });

    it('devrait être idempotent (ne rien créer si une commission existe déjà)', async () => {
      mockPrisma.commissionEarning.findFirst.mockResolvedValue({ id: 'earn-1' });

      await service.recordCommission('txn-1');

      expect(mockPrisma.transaction.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.commissionEarning.create).not.toHaveBeenCalled();
    });
  });

  // ─── validatePayment() (batch) ────────────────────────────────────────────────

  describe('validatePayment()', () => {
    it('devrait agréger les commissions par agent et créer un paiement', async () => {
      mockPrisma.commissionEarning.findMany.mockResolvedValue([earning]);
      mockPrisma.commissionPayment.create.mockResolvedValue({
        id: 'pay-1',
        netAmount: 280,
      });

      const result = await service.validatePayment(
        { commissionIds: ['earn-1'] },
        'tenant-1',
        'user-1',
      );

      expect(result.commissionsPayees).toBe(1);
      expect(result.montantTotal).toBe(280); // somme des agentAmount
      expect(result.paiements).toBe(1);
      expect(mockPrisma.commissionPayment.create).toHaveBeenCalledTimes(1);
    });

    it('devrait lever NotFoundException si aucune commission trouvée', async () => {
      mockPrisma.commissionEarning.findMany.mockResolvedValue([]);

      await expect(
        service.validatePayment({ commissionIds: ['bad-id'] }, 'tenant-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
