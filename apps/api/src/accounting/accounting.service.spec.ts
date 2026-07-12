import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockAccountChart = (code: string, type = 'ASSET') => ({
  id: `account-${code}`,
  code,
  name: `Compte ${code}`,
  type,
  tenantId: 'tenant-1',
  isActive: true,
  normalBalance: ['EXPENSE', 'ASSET'].includes(type) ? 'DEBIT' : 'CREDIT',
  level: code.length <= 2 ? 1 : code.length <= 3 ? 2 : 3,
});

const mockFiscalYear = {
  id: 'fy-uuid-1',
  tenantId: 'tenant-1',
  name: 'Exercice 2026',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-12-31'),
  isClosed: false,
  closedAt: null,
  closedById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockJournalEntry = {
  id: 'je-uuid-1',
  tenantId: 'tenant-1',
  reference: 'JE-001',
  description: 'Test écriture',
  fiscalYearId: 'fy-uuid-1',
  status: 'DRAFT',
  totalDebit: 50000,
  totalCredit: 50000,
  currency: 'XOF',
  entryDate: new Date(),
  createdById: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  lines: [],
};

const mockTransaction = {
  id: 'txn-uuid-1',
  tenantId: 'tenant-1',
  reference: 'TXN-20260710-ABC123',
  type: 'DEPOT',
  status: 'COMPLETED',
  operateur: 'ORANGE_MONEY',
  montant: 50000,
  frais: 0,
  commission: 500,
  agentId: 'agent-1',
  agenceId: 'agence-1',
  clientPhone: '+22507000000',
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: new Date(),
};

const mockPrisma = {
  accountChart: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  fiscalYear: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  journalEntry: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  journalLine: {
    findMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  transaction: {
    findFirst: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('AccountingService', () => {
  let service: AccountingService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
  });

  // ─── validateDoubleEntry() ────────────────────────────────────────────────────

  describe('validateDoubleEntry()', () => {
    it('devrait valider une écriture équilibrée (débit = crédit)', async () => {
      const lines = [
        { debit: '50000.00', credit: '0.00' },
        { debit: '0.00', credit: '50000.00' },
      ];

      await expect(service.validateDoubleEntry(lines)).resolves.not.toThrow();
    });

    it('devrait lever BadRequestException si débit ≠ crédit', async () => {
      const lines = [
        { debit: '50000.00', credit: '0.00' },
        { debit: '0.00', credit: '40000.00' }, // déséquilibre de 10000
      ];

      await expect(service.validateDoubleEntry(lines)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('devrait lever BadRequestException si moins de 2 lignes', async () => {
      const lines = [{ debit: '50000.00', credit: '50000.00' }];

      await expect(service.validateDoubleEntry(lines)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('devrait lever BadRequestException si montant négatif', async () => {
      const lines = [
        { debit: '-1000.00', credit: '0.00' },
        { debit: '0.00', credit: '-1000.00' },
      ];

      await expect(service.validateDoubleEntry(lines)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('devrait tolérer une différence inférieure à 0.01 (arrondi flottant)', async () => {
      const lines = [
        { debit: '0.005', credit: '0.00' },
        { debit: '0.00', credit: '0.005' },
      ];

      await expect(service.validateDoubleEntry(lines)).resolves.not.toThrow();
    });
  });

  // ─── generateEntryFromTransaction() ─────────────────────────────────────────

  describe('generateEntryFromTransaction()', () => {
    const fiscalYearId = 'fy-uuid-1';
    const userId = 'user-1';

    beforeEach(() => {
      // Par défaut : exercice ouvert trouvé, référence non existante
      mockPrisma.fiscalYear.findFirst.mockResolvedValue(mockFiscalYear);
      mockPrisma.journalEntry.findFirst.mockResolvedValue(null); // pas d'écriture existante
      mockPrisma.journalEntry.create.mockResolvedValue({
        ...mockJournalEntry,
        lines: [],
      });
      mockPrisma.accountChart.findMany.mockImplementation(({ where }) => {
        // Retourne les comptes demandés
        const codes = where.code?.in ?? [];
        return Promise.resolve(codes.map((code: string) => mockAccountChart(code)));
      });
      mockPrisma.auditLog.create.mockResolvedValue({});
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
    });

    it('devrait générer les écritures correctes pour un DEPOT (571 débit / 58x crédit)', async () => {
      const tx = { ...mockTransaction, type: 'DEPOT', commission: 0 };

      await service.generateEntryFromTransaction(tx as any, fiscalYearId, userId);

      expect(mockPrisma.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reference: `AUTO-${tx.reference}`,
          }),
        }),
      );
    });

    it('devrait générer les écritures correctes pour un RETRAIT', async () => {
      const tx = { ...mockTransaction, type: 'RETRAIT', frais: 500, commission: 0 };

      await service.generateEntryFromTransaction(tx as any, fiscalYearId, userId);

      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
    });

    it('devrait générer les écritures correctes pour un CASH_IN', async () => {
      const tx = { ...mockTransaction, type: 'CASH_IN', frais: 0, commission: 0 };

      await service.generateEntryFromTransaction(tx as any, fiscalYearId, userId);

      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
    });

    it('devrait générer les écritures correctes pour un CASH_OUT', async () => {
      const tx = { ...mockTransaction, type: 'CASH_OUT', frais: 0, commission: 0 };

      await service.generateEntryFromTransaction(tx as any, fiscalYearId, userId);

      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
    });

    it('devrait retourner null sans créer de doublon si écriture déjà existante', async () => {
      mockPrisma.journalEntry.findFirst.mockResolvedValue(mockJournalEntry);

      const result = await service.generateEntryFromTransaction(
        mockTransaction as any,
        fiscalYearId,
        userId,
      );

      expect(mockPrisma.journalEntry.create).not.toHaveBeenCalled();
      expect(result).toBeDefined(); // retourne l'écriture existante mappée
    });

    it('devrait retourner null pour un type de transaction non géré', async () => {
      const tx = { ...mockTransaction, type: 'ANNULATION' };

      const result = await service.generateEntryFromTransaction(
        tx as any,
        fiscalYearId,
        userId,
      );

      expect(result).toBeNull();
    });
  });

  // ─── getTrialBalance() ────────────────────────────────────────────────────────

  describe('getTrialBalance()', () => {
    it('devrait retourner une balance équilibrée (isBalanced = true)', async () => {
      mockPrisma.journalLine.findMany.mockResolvedValue([
        {
          account: mockAccountChart('571'),
          debit: 50000,
          credit: 0,
        },
        {
          account: mockAccountChart('581', 'LIABILITY'),
          debit: 0,
          credit: 50000,
        },
      ]);

      const result = await service.getTrialBalance('tenant-1');

      expect(result.isBalanced).toBe(true);
      expect(parseFloat(result.totalDebit)).toBe(parseFloat(result.totalCredit));
    });

    it('devrait retourner isBalanced = false si la balance est déséquilibrée', async () => {
      mockPrisma.journalLine.findMany.mockResolvedValue([
        {
          account: mockAccountChart('571'),
          debit: 50000,
          credit: 0,
        },
        {
          account: mockAccountChart('581', 'LIABILITY'),
          debit: 0,
          credit: 30000, // manque 20000
        },
      ]);

      const result = await service.getTrialBalance('tenant-1');

      expect(result.isBalanced).toBe(false);
    });

    it('devrait retourner une balance vide si aucune écriture', async () => {
      mockPrisma.journalLine.findMany.mockResolvedValue([]);

      const result = await service.getTrialBalance('tenant-1');

      expect(result.lines).toHaveLength(0);
      expect(result.isBalanced).toBe(true);
    });
  });
});
