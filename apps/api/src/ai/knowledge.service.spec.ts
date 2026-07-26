import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeService } from './knowledge.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

const mockPrisma = {
  documentBase: {
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
};

// ─── Fixtures ────────────────────────────────────────────────────────────────

const docA = {
  id: 'doc-1',
  slug: 'float-bas',
  titre: 'Gestion du float bas',
  categorie: 'float',
  contenu: "Le float represente le solde d'argent electronique chez un operateur.",
  mots_cles: ['float', 'solde', 'operateur'],
  source: 'guide',
};

const docB = {
  id: 'doc-2',
  slug: 'transactions',
  titre: 'Journal des transactions',
  categorie: 'transactions',
  contenu: 'A'.repeat(1200), // contenu long pour tester la troncature
  mots_cles: ['transaction', 'depot', 'retrait'],
  source: 'guide',
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('KnowledgeService', () => {
  let service: KnowledgeService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<KnowledgeService>(KnowledgeService);
  });

  // ─── chercher() ─────────────────────────────────────────────────────────────

  describe('chercher()', () => {
    it('retourne les documents correspondant a la query', async () => {
      mockPrisma.documentBase.findMany.mockResolvedValue([docA]);

      const result = await service.chercher('float');

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('float-bas');
      expect(mockPrisma.documentBase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ titre: expect.any(Object) }),
              expect.objectContaining({ contenu: expect.any(Object) }),
            ]),
          }),
        }),
      );
    });

    it('retourne un tableau vide si aucune correspondance', async () => {
      mockPrisma.documentBase.findMany.mockResolvedValue([]);

      const result = await service.chercher('aucun-resultat-xyzzy');

      expect(result).toEqual([]);
    });

    it('retourne un tableau vide si Prisma leve une erreur (table absente)', async () => {
      mockPrisma.documentBase.findMany.mockRejectedValue(
        new Error('relation "document_base" does not exist'),
      );

      const result = await service.chercher('float');

      expect(result).toEqual([]);
    });
  });

  // ─── construireContexte() ───────────────────────────────────────────────────

  describe('construireContexte()', () => {
    it('retourne une chaine vide si aucun document trouve', async () => {
      mockPrisma.documentBase.findMany.mockResolvedValue([]);

      const result = await service.construireContexte('query-inconnue');

      expect(result).toBe('');
    });

    it('retourne un bloc formate avec titre et contenu tronque a 800 chars max par doc', async () => {
      mockPrisma.documentBase.findMany.mockResolvedValue([docB]);

      const result = await service.construireContexte('transaction');

      // Le contenu original fait 1200 chars → doit etre tronque a 800
      expect(result).toContain('### Journal des transactions');
      expect(result).toContain('…'); // indicateur de troncature
      // Ne doit pas depasser 8000 chars au total
      expect(result.length).toBeLessThanOrEqual(8000);
    });

    it('respecte la limite de 3 documents maximum (take:3)', async () => {
      const docs = [1, 2, 3, 4].map((i) => ({
        ...docA,
        id: `doc-${i}`,
        slug: `slug-${i}`,
        titre: `Titre ${i}`,
        contenu: 'Contenu court.',
      }));
      mockPrisma.documentBase.findMany.mockResolvedValue(docs);

      await service.construireContexte('test');

      // findMany est appele avec take:3
      expect(mockPrisma.documentBase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 3 }),
      );
    });

    it('tronque le contexte total a 8000 chars si les docs sont volumineux', async () => {
      const gros = {
        ...docA,
        contenu: 'X'.repeat(4000),
      };
      mockPrisma.documentBase.findMany.mockResolvedValue([gros, gros, gros]);

      const result = await service.construireContexte('test');

      expect(result.length).toBeLessThanOrEqual(8000);
    });
  });

  // ─── synchroniser() ─────────────────────────────────────────────────────────

  describe('synchroniser()', () => {
    it('appelle upsert pour chaque entree et retourne le nombre de docs traites', async () => {
      mockPrisma.documentBase.upsert.mockResolvedValue({});

      const entrees = [
        {
          slug: 'float-bas',
          titre: 'Float bas',
          categorie: 'float',
          contenu: 'Contenu A',
          mots_cles: ['float'],
          source: 'guide',
        },
        {
          slug: 'transactions',
          titre: 'Transactions',
          categorie: 'transactions',
          contenu: 'Contenu B',
          mots_cles: ['transaction'],
          source: 'guide',
          langue: 'fr',
        },
      ];

      const count = await service.synchroniser(entrees);

      expect(mockPrisma.documentBase.upsert).toHaveBeenCalledTimes(2);
      expect(count).toBe(2);
      expect(mockPrisma.documentBase.upsert).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: { slug: 'float-bas' },
        }),
      );
    });

    it("utilise 'fr' comme langue par defaut si non precisee", async () => {
      mockPrisma.documentBase.upsert.mockResolvedValue({});

      await service.synchroniser([
        {
          slug: 'doc-sans-langue',
          titre: 'Sans langue',
          categorie: 'test',
          contenu: 'Contenu',
          mots_cles: [],
          source: 'guide',
          // langue omis
        },
      ]);

      expect(mockPrisma.documentBase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ langue: 'fr' }),
          update: expect.objectContaining({ langue: 'fr' }),
        }),
      );
    });
  });
});
