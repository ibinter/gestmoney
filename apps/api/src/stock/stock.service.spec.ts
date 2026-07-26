import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { StockService } from './stock.service';
import { PrismaService } from '../prisma/prisma.service';
import { TypeMouvementArticle } from './dto/article-stock.dto';

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const mockPrisma = {
  articleStock: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  mouvementArticle: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  product: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  inventory: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  stockMovement: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  supplier: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  purchaseOrder: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  tenant: {
    findMany: jest.fn(),
  },
  alerteEmise: {
    create: jest.fn(),
  },
  $transaction: jest.fn((fn) => {
    if (typeof fn === 'function') return fn(mockPrisma);
    return Promise.all(fn);
  }),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TENANT = 'tenant-1';
const USER_ID = 'user-1';

const mockArticle = {
  id: 'art-1',
  tenantId: TENANT,
  reference: 'REF-001',
  nom: 'Stylo bleu',
  description: 'Stylo à bille bleu',
  categorie: 'FOURNITURE',
  unite: 'pièce',
  prixUnitaire: new Prisma.Decimal(150),
  seuilAlerte: 5,
  quantite: 10,
  actif: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMouvement = {
  id: 'mv-1',
  articleId: 'art-1',
  tenantId: TENANT,
  type: TypeMouvementArticle.ENTREE,
  quantite: 5,
  quantiteAvant: 10,
  quantiteApres: 15,
  motif: 'Réapprovisionnement',
  reference: 'REF-BL-001',
  userId: USER_ID,
  createdAt: new Date(),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('StockService — module ArticleStock', () => {
  let service: StockService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  // ─── listerArticles ─────────────────────────────────────────────────────────

  describe('listerArticles()', () => {
    it('retourne une liste paginée avec les métadonnées', async () => {
      mockPrisma.$transaction.mockResolvedValue([2, [mockArticle, { ...mockArticle, id: 'art-2' }]]);

      const result = await service.listerArticles(TENANT, { page: 1, limit: 20 });

      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.data).toHaveLength(2);
    });

    it('filtre par catégorie quand opts.categorie est fourni', async () => {
      mockPrisma.$transaction.mockResolvedValue([1, [mockArticle]]);

      await service.listerArticles(TENANT, { categorie: 'FOURNITURE' });

      // Le where transmis doit contenir categorie
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('filtre alerteSeulement — ne retourne que les articles sous seuil', async () => {
      const articleSousSeuil = { ...mockArticle, quantite: 3, seuilAlerte: 5 };
      const articleOk = { ...mockArticle, id: 'art-ok', quantite: 20, seuilAlerte: 5 };
      mockPrisma.$transaction.mockResolvedValue([2, [articleSousSeuil, articleOk]]);

      const result = await service.listerArticles(TENANT, { alerteSeulement: true });

      // Seul l'article sous seuil doit être dans data
      expect(result.data.every((d) => d.sousSeuil)).toBe(true);
    });

    it('calcule correctement valeur = prixUnitaire * quantite', async () => {
      mockPrisma.$transaction.mockResolvedValue([1, [mockArticle]]);

      const result = await service.listerArticles(TENANT);

      const art = result.data[0];
      expect(art.valeur).toBeCloseTo(150 * 10);
    });

    it('marque enRupture=true quand quantite=0', async () => {
      const rupture = { ...mockArticle, quantite: 0 };
      mockPrisma.$transaction.mockResolvedValue([1, [rupture]]);

      const result = await service.listerArticles(TENANT);

      expect(result.data[0].enRupture).toBe(true);
    });

    it('utilise des valeurs de pagination par défaut (page=1, limit=20) si non fournies', async () => {
      mockPrisma.$transaction.mockResolvedValue([0, []]);

      const result = await service.listerArticles(TENANT);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  // ─── getArticle ─────────────────────────────────────────────────────────────

  describe('getArticle()', () => {
    it("lève NotFoundException si l'article est absent", async () => {
      mockPrisma.articleStock.findFirst.mockResolvedValue(null);

      await expect(service.getArticle('inexistant', TENANT)).rejects.toThrow(NotFoundException);
    });

    it('retourne l\'article avec valeur calculée si présent', async () => {
      mockPrisma.articleStock.findFirst.mockResolvedValue(mockArticle);

      const result = await service.getArticle('art-1', TENANT);

      expect(result.id).toBe('art-1');
      expect(result.valeur).toBeCloseTo(150 * 10);
    });
  });

  // ─── creerArticle ───────────────────────────────────────────────────────────

  describe('creerArticle()', () => {
    it('crée un article avec quantite=0 par défaut', async () => {
      const created = { ...mockArticle, quantite: 0 };
      mockPrisma.articleStock.create.mockResolvedValue(created);

      const result = await service.creerArticle(TENANT, {
        reference: 'REF-001',
        nom: 'Stylo bleu',
        categorie: 'FOURNITURE',
        prixUnitaire: 150,
      });

      expect(result.valeur).toBe(0);
      expect(mockPrisma.articleStock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ quantite: 0 }),
        }),
      );
    });

    it('utilise "pièce" comme unité par défaut si non fournie', async () => {
      mockPrisma.articleStock.create.mockResolvedValue({ ...mockArticle, unite: 'pièce' });

      await service.creerArticle(TENANT, {
        reference: 'REF-001',
        nom: 'Test',
        categorie: 'FOURNITURE',
        prixUnitaire: 100,
      });

      expect(mockPrisma.articleStock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ unite: 'pièce' }),
        }),
      );
    });

    it('utilise seuilAlerte=5 par défaut si non fourni', async () => {
      mockPrisma.articleStock.create.mockResolvedValue(mockArticle);

      await service.creerArticle(TENANT, {
        reference: 'REF-001',
        nom: 'Test',
        categorie: 'FOURNITURE',
        prixUnitaire: 100,
      });

      expect(mockPrisma.articleStock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ seuilAlerte: 5 }),
        }),
      );
    });
  });

  // ─── modifierArticle ────────────────────────────────────────────────────────

  describe('modifierArticle()', () => {
    it('met à jour correctement les champs fournis', async () => {
      mockPrisma.articleStock.findFirst.mockResolvedValue(mockArticle);
      const updated = { ...mockArticle, nom: 'Stylo rouge' };
      mockPrisma.articleStock.update.mockResolvedValue(updated);

      const result = await service.modifierArticle('art-1', TENANT, { nom: 'Stylo rouge' });

      expect(result.nom).toBe('Stylo rouge');
      expect(mockPrisma.articleStock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'art-1' },
          data: expect.objectContaining({ nom: 'Stylo rouge' }),
        }),
      );
    });

    it("lève NotFoundException si l'article est absent", async () => {
      mockPrisma.articleStock.findFirst.mockResolvedValue(null);

      await expect(service.modifierArticle('inexistant', TENANT, { nom: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── entree ─────────────────────────────────────────────────────────────────

  describe('entree()', () => {
    it('augmente la quantité et crée un mouvement ENTREE', async () => {
      mockPrisma.articleStock.findFirst.mockResolvedValue(mockArticle);
      const articleUpdated = { ...mockArticle, quantite: 15 };
      const mouvementCreated = { ...mockMouvement, quantiteApres: 15 };
      // Le service appelle $transaction([update, create]) — forme tableau
      mockPrisma.$transaction.mockResolvedValue([articleUpdated, mouvementCreated]);

      const result = await service.entree('art-1', TENANT, { quantite: 5, motif: 'Réapprovisionnement' }, USER_ID);

      expect(result.article.quantite).toBe(15);
      expect(result.mouvement.type).toBe(TypeMouvementArticle.ENTREE);
    });

    it('enregistre quantiteAvant et quantiteApres corrects dans le mouvement', async () => {
      mockPrisma.articleStock.findFirst.mockResolvedValue({ ...mockArticle, quantite: 10 });

      // Capture les args passés à $transaction pour inspecter mouvementArticle.create
      mockPrisma.articleStock.update.mockResolvedValue({ ...mockArticle, quantite: 15 });
      let capturedMouvementData: any;
      mockPrisma.mouvementArticle.create.mockImplementation(({ data }: any) => {
        capturedMouvementData = data;
        return Promise.resolve({ ...mockMouvement, ...data });
      });
      // Exécute réellement les deux opérations promises passées dans le tableau
      mockPrisma.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));

      await service.entree('art-1', TENANT, { quantite: 5, motif: 'Test' }, USER_ID);

      expect(capturedMouvementData.quantiteAvant).toBe(10);
      expect(capturedMouvementData.quantiteApres).toBe(15);
    });

    it("lève NotFoundException si l'article est introuvable", async () => {
      mockPrisma.articleStock.findFirst.mockResolvedValue(null);

      await expect(
        service.entree('inexistant', TENANT, { quantite: 5, motif: 'Test' }, USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── sortie ─────────────────────────────────────────────────────────────────

  describe('sortie()', () => {
    it('diminue la quantité et crée un mouvement SORTIE', async () => {
      mockPrisma.articleStock.findFirst.mockResolvedValue({ ...mockArticle, quantite: 10 });
      const articleUpdated = { ...mockArticle, quantite: 7 };
      const mouvementCreated = { ...mockMouvement, type: TypeMouvementArticle.SORTIE, quantiteApres: 7 };
      mockPrisma.$transaction.mockResolvedValue([articleUpdated, mouvementCreated]);

      const result = await service.sortie('art-1', TENANT, { quantite: 3, motif: 'Vente' }, USER_ID);

      expect(result.article.quantite).toBe(7);
      expect(result.mouvement.type).toBe(TypeMouvementArticle.SORTIE);
    });

    it('lève BadRequestException si stock insuffisant', async () => {
      mockPrisma.articleStock.findFirst.mockResolvedValue({ ...mockArticle, quantite: 2 });

      await expect(
        service.sortie('art-1', TENANT, { quantite: 10, motif: 'Vente' }, USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('le message de stock insuffisant mentionne la quantité disponible et demandée', async () => {
      mockPrisma.articleStock.findFirst.mockResolvedValue({ ...mockArticle, quantite: 2 });

      await expect(
        service.sortie('art-1', TENANT, { quantite: 10, motif: 'Vente' }, USER_ID),
      ).rejects.toThrow(/2.*10|disponible/i);
    });
  });

  // ─── ajustement ─────────────────────────────────────────────────────────────

  describe('ajustement()', () => {
    it('crée un mouvement AJUSTEMENT avec quantiteAvant et quantiteApres corrects', async () => {
      mockPrisma.articleStock.findFirst.mockResolvedValue({ ...mockArticle, quantite: 10 });

      mockPrisma.articleStock.update.mockResolvedValue({ ...mockArticle, quantite: 25 });
      let capturedData: any;
      mockPrisma.mouvementArticle.create.mockImplementation(({ data }: any) => {
        capturedData = data;
        return Promise.resolve({ ...mockMouvement, ...data });
      });
      mockPrisma.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));

      await service.ajustement('art-1', TENANT, { nouvelleQuantite: 25, motif: 'Inventaire' }, USER_ID);

      expect(capturedData.type).toBe(TypeMouvementArticle.AJUSTEMENT);
      expect(capturedData.quantiteAvant).toBe(10);
      expect(capturedData.quantiteApres).toBe(25);
      expect(capturedData.quantite).toBe(15); // diff = 25 - 10
    });

    it('gère un ajustement à la baisse (diff négatif)', async () => {
      mockPrisma.articleStock.findFirst.mockResolvedValue({ ...mockArticle, quantite: 20 });

      mockPrisma.articleStock.update.mockResolvedValue({ ...mockArticle, quantite: 5 });
      let capturedData: any;
      mockPrisma.mouvementArticle.create.mockImplementation(({ data }: any) => {
        capturedData = data;
        return Promise.resolve({ ...mockMouvement, ...data });
      });
      mockPrisma.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));

      await service.ajustement('art-1', TENANT, { nouvelleQuantite: 5, motif: 'Correction' }, USER_ID);

      expect(capturedData.quantite).toBe(-15); // diff = 5 - 20
    });

    it("lève NotFoundException si l'article est introuvable", async () => {
      mockPrisma.articleStock.findFirst.mockResolvedValue(null);

      await expect(
        service.ajustement('inexistant', TENANT, { nouvelleQuantite: 10, motif: 'Test' }, USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── statsStock ─────────────────────────────────────────────────────────────

  describe('statsStock()', () => {
    it('retourne les 4 KPIs : totalArticles, valeurTotale, enRupture, sousSeuil', async () => {
      const articles = [
        { ...mockArticle, quantite: 0, prixUnitaire: new Prisma.Decimal(100), seuilAlerte: 5 }, // rupture
        { ...mockArticle, id: 'art-2', quantite: 3, prixUnitaire: new Prisma.Decimal(200), seuilAlerte: 5 }, // sousSeuil
        { ...mockArticle, id: 'art-3', quantite: 20, prixUnitaire: new Prisma.Decimal(50), seuilAlerte: 5 }, // ok
      ];
      mockPrisma.articleStock.findMany.mockResolvedValue(articles);

      const result = await service.statsStock(TENANT);

      expect(result.totalArticles).toBe(3);
      expect(result.enRupture).toBe(1);
      expect(result.sousSeuil).toBe(1);
      expect(result.valeurTotale).toBeCloseTo(0 * 100 + 3 * 200 + 20 * 50); // 0 + 600 + 1000 = 1600
    });

    it('retourne valeurTotale=0 et tous compteurs=0 si aucun article', async () => {
      mockPrisma.articleStock.findMany.mockResolvedValue([]);

      const result = await service.statsStock(TENANT);

      expect(result).toEqual({ totalArticles: 0, valeurTotale: 0, enRupture: 0, sousSeuil: 0 });
    });

    it("ne compte pas un article en rupture dans sousSeuil (quantite=0 → enRupture)", async () => {
      const articles = [
        { ...mockArticle, quantite: 0, prixUnitaire: new Prisma.Decimal(100), seuilAlerte: 5 },
      ];
      mockPrisma.articleStock.findMany.mockResolvedValue(articles);

      const result = await service.statsStock(TENANT);

      expect(result.enRupture).toBe(1);
      expect(result.sousSeuil).toBe(0);
    });
  });
});
