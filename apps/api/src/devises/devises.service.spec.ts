import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DevisesService } from './devises.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

const mockPrisma = {
  tauxChange: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('DevisesService', () => {
  let service: DevisesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevisesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DevisesService>(DevisesService);
  });

  // ─── getTaux() ──────────────────────────────────────────────────────────────

  describe('getTaux()', () => {
    it('retourne 1 si la devise source et la devise cible sont identiques', async () => {
      const result = await service.getTaux('XOF', 'XOF');
      expect(result).toBe(1);
      // Aucune requete DB inutile
      expect(mockPrisma.tauxChange.findUnique).not.toHaveBeenCalled();
    });

    it('retourne le taux direct pour une paire de devises connue', async () => {
      mockPrisma.tauxChange.findUnique.mockResolvedValueOnce({ taux: 655.957 });

      const result = await service.getTaux('EUR', 'XOF');

      expect(result).toBe(655.957);
      expect(mockPrisma.tauxChange.findUnique).toHaveBeenCalledWith({
        where: { deviseBase_deviseCible: { deviseBase: 'EUR', deviseCible: 'XOF' } },
      });
    });

    it('retourne le taux inverse (1/taux) si le taux direct est absent', async () => {
      mockPrisma.tauxChange.findUnique
        .mockResolvedValueOnce(null)          // pas de taux direct EUR→USD
        .mockResolvedValueOnce({ taux: 0.5 }); // taux inverse USD→EUR = 0.5

      const result = await service.getTaux('EUR', 'USD');

      expect(result).toBeCloseTo(2, 5); // 1 / 0.5 = 2
    });

    it('leve NotFoundException si aucun taux (direct ou inverse) n est connu', async () => {
      mockPrisma.tauxChange.findUnique.mockResolvedValue(null);

      await expect(service.getTaux('GBP', 'JPY')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── convertir() ────────────────────────────────────────────────────────────

  describe('convertir()', () => {
    it('calcule correctement montant * taux', async () => {
      mockPrisma.tauxChange.findUnique.mockResolvedValueOnce({ taux: 655.957 });

      const result = await service.convertir(100, 'EUR', 'XOF');

      // 100 * 655.957 = 65595.7 arrondi a 4 decimales
      expect(result).toBe(65595.7);
    });

    it('retourne le montant inchange si devise source === devise cible', async () => {
      const result = await service.convertir(1234, 'XOF', 'XOF');
      expect(result).toBe(1234);
    });
  });

  // ─── updateTaux() ────────────────────────────────────────────────────────────

  describe('updateTaux()', () => {
    it('met a jour (upsert) le taux en DB et retourne l enregistrement', async () => {
      const dto = { deviseBase: 'USD', deviseCible: 'XOF', taux: 600, source: 'MANUAL' };
      mockPrisma.tauxChange.upsert.mockResolvedValue({ id: 'tx-1', ...dto });

      const result = await service.updateTaux(dto as any);

      expect(mockPrisma.tauxChange.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deviseBase_deviseCible: { deviseBase: 'USD', deviseCible: 'XOF' },
          },
          update: expect.objectContaining({ taux: 600, source: 'MANUAL' }),
          create: expect.objectContaining({
            deviseBase: 'USD',
            deviseCible: 'XOF',
            taux: 600,
          }),
        }),
      );
      expect(result.taux).toBe(600);
    });

    it("utilise 'MANUAL' comme source par defaut si non precisee", async () => {
      const dto = { deviseBase: 'EUR', deviseCible: 'XOF', taux: 655 };
      mockPrisma.tauxChange.upsert.mockResolvedValue({ ...dto, source: 'MANUAL' });

      await service.updateTaux(dto as any);

      expect(mockPrisma.tauxChange.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ source: 'MANUAL' }),
          create: expect.objectContaining({ source: 'MANUAL' }),
        }),
      );
    });
  });

  // ─── getTousTaux() ───────────────────────────────────────────────────────────

  describe('getTousTaux()', () => {
    it('retourne tous les taux tries par deviseBase puis deviseCible', async () => {
      const taux = [
        { deviseBase: 'EUR', deviseCible: 'XOF', taux: 655.957 },
        { deviseBase: 'USD', deviseCible: 'XOF', taux: 600 },
      ];
      mockPrisma.tauxChange.findMany.mockResolvedValue(taux);

      const result = await service.getTousTaux();

      expect(result).toHaveLength(2);
      expect(mockPrisma.tauxChange.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ deviseBase: 'asc' }, { deviseCible: 'asc' }],
        }),
      );
    });
  });

  // ─── montantEnXOF() ──────────────────────────────────────────────────────────

  describe('montantEnXOF()', () => {
    it('retourne le montant original sans conversion si la devise est XOF', async () => {
      const result = await service.montantEnXOF(50_000, 'XOF');

      expect(result).toBe(50_000);
      // Court-circuit : aucune requete DB
      expect(mockPrisma.tauxChange.findUnique).not.toHaveBeenCalled();
    });

    it('convertit correctement en XOF si la devise est differente de XOF', async () => {
      mockPrisma.tauxChange.findUnique.mockResolvedValueOnce({ taux: 655.957 });

      const result = await service.montantEnXOF(10, 'EUR');

      expect(result).toBe(6559.57); // 10 * 655.957 = 6559.57
    });
  });
});
