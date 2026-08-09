import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { KycDossierService } from './kyc-dossier.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const mockPrisma = {
  kycDossier: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  customer: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TENANT = 'tenant-1';
const CLIENT_ID = 'client-1';
const DOSSIER_ID = 'dossier-1';
const VERIFIEUR_ID = 'agent-1';

const mockClient = {
  id: CLIENT_ID,
  tenantId: TENANT,
  firstName: 'Ama',
  lastName: 'Koffi',
  phoneNumber: '+22507000000',
  email: 'ama@test.ci',
  kycStatus: 'PENDING',
};

const mockDossier = {
  id: DOSSIER_ID,
  clientId: CLIENT_ID,
  tenantId: TENANT,
  statut: 'EN_COURS',
  typeDocument: 'CNI',
  numeroDocument: 'CI1234',
  dateExpiration: null,
  paysEmetteur: 'CI',
  photoRecto: null,
  photoVerso: null,
  photoSelfie: null,
  verifiePar: null,
  verifieAt: null,
  commentaire: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Helper : construit un data-URL base64 valide d'une taille donnée en octets
function makeDataUrl(sizeBytes: number): string {
  const raw = Buffer.alloc(sizeBytes, 'a').toString('base64');
  return `data:image/jpeg;base64,${raw}`;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('KycDossierService', () => {
  let service: KycDossierService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycDossierService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<KycDossierService>(KycDossierService);
  });

  // ─── getDossier ─────────────────────────────────────────────────────────────

  describe('getDossier()', () => {
    it('retourne null si aucun dossier trouvé', async () => {
      mockPrisma.kycDossier.findFirst.mockResolvedValue(null);

      const result = await service.getDossier(CLIENT_ID, TENANT);

      expect(result).toBeNull();
    });

    it('retourne le dossier si présent', async () => {
      mockPrisma.kycDossier.findFirst.mockResolvedValue(mockDossier);

      const result = await service.getDossier(CLIENT_ID, TENANT);

      expect(result).toEqual(mockDossier);
      expect(mockPrisma.kycDossier.findFirst).toHaveBeenCalledWith({
        where: { clientId: CLIENT_ID, tenantId: TENANT },
      });
    });
  });

  // ─── soumettreDocuments ──────────────────────────────────────────────────────

  describe('soumettreDocuments()', () => {
    const dto = {
      typeDocument: 'CNI',
      numeroDocument: 'CI1234',
      paysEmetteur: 'CI',
    };

    it('crée un dossier EN_COURS et met à jour kycStatus sur Customer', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockClient);
      mockPrisma.kycDossier.upsert.mockResolvedValue({ ...mockDossier, statut: 'EN_COURS' });
      mockPrisma.customer.update.mockResolvedValue({});

      const result = await service.soumettreDocuments(CLIENT_ID, TENANT, dto);

      expect(result.statut).toBe('EN_COURS');
      expect(mockPrisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ kycStatus: 'PENDING' }),
        }),
      );
    });

    it("lève NotFoundException si le client n'appartient pas au tenant", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await expect(service.soumettreDocuments(CLIENT_ID, TENANT, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejette une photo > 5 Mo (base64 trop longue)', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockClient);

      const grosePhoto = makeDataUrl(5_100_000); // > 5 Mo

      await expect(
        service.soumettreDocuments(CLIENT_ID, TENANT, { ...dto, photoRecto: grosePhoto }),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepte une photo de moins de 5 Mo', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockClient);
      mockPrisma.kycDossier.upsert.mockResolvedValue(mockDossier);
      mockPrisma.customer.update.mockResolvedValue({});

      const petitePhoto = makeDataUrl(1_000_000); // 1 Mo

      await expect(
        service.soumettreDocuments(CLIENT_ID, TENANT, { ...dto, photoRecto: petitePhoto }),
      ).resolves.toBeDefined();
    });

    it("rejette si la date d'expiration de la pièce est déjà passée", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockClient);

      await expect(
        service.soumettreDocuments(CLIENT_ID, TENANT, {
          ...dto,
          dateExpiration: '2020-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette une data URL malformée (pas en base64)', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockClient);

      await expect(
        service.soumettreDocuments(CLIENT_ID, TENANT, { ...dto, photoSelfie: 'pas-une-data-url' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── valider ────────────────────────────────────────────────────────────────

  describe('valider()', () => {
    it('passe le dossier en VALIDE et met Customer en VERIFIED', async () => {
      mockPrisma.kycDossier.findUnique.mockResolvedValue(mockDossier);
      mockPrisma.kycDossier.update.mockResolvedValue({ ...mockDossier, statut: 'VALIDE' });
      mockPrisma.customer.update.mockResolvedValue({});

      const result = await service.valider(DOSSIER_ID, VERIFIEUR_ID);

      expect(result.statut).toBe('VALIDE');
      expect(mockPrisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ kycStatus: 'VERIFIED', kycVerified: true }),
        }),
      );
    });

    it('lève NotFoundException si le dossier est absent', async () => {
      mockPrisma.kycDossier.findUnique.mockResolvedValue(null);

      await expect(service.valider(DOSSIER_ID, VERIFIEUR_ID)).rejects.toThrow(NotFoundException);
    });

    it('lève BadRequestException si le dossier est déjà validé', async () => {
      mockPrisma.kycDossier.findUnique.mockResolvedValue({ ...mockDossier, statut: 'VALIDE' });

      await expect(service.valider(DOSSIER_ID, VERIFIEUR_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── refuser ────────────────────────────────────────────────────────────────

  describe('refuser()', () => {
    it("passe le dossier en REFUSE et met Customer en REJECTED avec la raison", async () => {
      mockPrisma.kycDossier.findUnique.mockResolvedValue(mockDossier);
      mockPrisma.kycDossier.update.mockResolvedValue({ ...mockDossier, statut: 'REFUSE' });
      mockPrisma.customer.update.mockResolvedValue({});

      const result = await service.refuser(DOSSIER_ID, VERIFIEUR_ID, {
        commentaire: 'Document illisible',
      });

      expect(result.statut).toBe('REFUSE');
      expect(mockPrisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            kycStatus: 'REJECTED',
            kycRejectionReason: 'Document illisible',
          }),
        }),
      );
    });

    it('lève NotFoundException si le dossier est absent', async () => {
      mockPrisma.kycDossier.findUnique.mockResolvedValue(null);

      await expect(
        service.refuser(DOSSIER_ID, VERIFIEUR_ID, { commentaire: 'Motif' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── listerDossiers ─────────────────────────────────────────────────────────

  describe('listerDossiers()', () => {
    it('retourne les dossiers paginés avec métadonnées', async () => {
      mockPrisma.kycDossier.findMany.mockResolvedValue([mockDossier]);
      mockPrisma.kycDossier.count.mockResolvedValue(1);

      const result = await service.listerDossiers(TENANT, { page: '1', limit: '20' });

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.totalPages).toBe(1);
    });

    it('filtre par statut quand opts.statut est fourni', async () => {
      mockPrisma.kycDossier.findMany.mockResolvedValue([]);
      mockPrisma.kycDossier.count.mockResolvedValue(0);

      await service.listerDossiers(TENANT, { statut: 'EN_COURS' });

      expect(mockPrisma.kycDossier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ statut: 'EN_COURS' }),
        }),
      );
    });

    it('calcule correctement totalPages', async () => {
      mockPrisma.kycDossier.findMany.mockResolvedValue([]);
      mockPrisma.kycDossier.count.mockResolvedValue(45);

      const result = await service.listerDossiers(TENANT, { page: '1', limit: '20' });

      expect(result.totalPages).toBe(3); // ceil(45/20)
    });
  });

  // ─── statsKyc ───────────────────────────────────────────────────────────────

  describe('statsKyc()', () => {
    it('retourne les comptes par statut et le total', async () => {
      mockPrisma.kycDossier.groupBy.mockResolvedValue([
        { statut: 'EN_COURS', _count: { _all: 5 } },
        { statut: 'VALIDE', _count: { _all: 10 } },
        { statut: 'REFUSE', _count: { _all: 2 } },
      ]);

      const result = (await service.statsKyc(TENANT)) as Record<string, number>;

      expect(result.EN_COURS).toBe(5);
      expect(result.VALIDE).toBe(10);
      expect(result.REFUSE).toBe(2);
      expect(result.total).toBe(17);
    });

    it('retourne 0 pour les statuts sans dossier', async () => {
      mockPrisma.kycDossier.groupBy.mockResolvedValue([]);

      const result = (await service.statsKyc(TENANT)) as Record<string, number>;

      expect(result.EN_ATTENTE).toBe(0);
      expect(result.VALIDE).toBe(0);
      expect(result.total).toBe(0);
    });
  });
});
