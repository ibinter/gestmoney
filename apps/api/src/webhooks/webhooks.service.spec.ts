import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import { NotFoundException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Mock global fetch ───────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// ─── Helper : vide la file de microtaches ────────────────────────────────────

const flushPromises = () => new Promise<void>((resolve) => setImmediate(resolve));

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

const mockPrisma = {
  webhookEndpoint: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
  webhookLivraison: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
};

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-1';
const SECRET = 'a'.repeat(64); // 32 octets en hex = 64 chars

const mockEndpoint = {
  id: 'ep-1',
  tenantId: TENANT_ID,
  url: 'https://example.com/webhook',
  secret: SECRET,
  evenements: ['transaction.created', 'float.low'],
  description: 'Endpoint de test',
  actif: true,
  createdAt: new Date(),
};

const mockLivraison = {
  id: 'liv-1',
  webhookId: 'ep-1',
  evenement: 'transaction.created',
  payload: { event: 'transaction.created', data: { id: 'tx-1' } },
  tentatives: 0,
  reussi: false,
  reponseCode: null,
  reponseBody: null,
  createdAt: new Date(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('WebhooksService', () => {
  let service: WebhooksService;
  let setTimeoutSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Rendre setTimeout instantane pour eviter les delais exponentiels dans les tests
    setTimeoutSpy = jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((fn: TimerHandler) => {
        if (typeof fn === 'function') fn();
        return 0 as any;
      });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  afterEach(() => {
    setTimeoutSpy.mockRestore();
  });

  // ─── creer() ────────────────────────────────────────────────────────────────

  describe('creer()', () => {
    it('cree l endpoint avec un secret HMAC genere aleatoirement', async () => {
      mockPrisma.webhookEndpoint.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'ep-new', ...data, createdAt: new Date() }),
      );

      const dto = {
        url: 'https://example.com/hook',
        evenements: ['transaction.created'],
        description: 'Mon hook',
      };

      const result = await service.creer(TENANT_ID, dto as any);

      expect(mockPrisma.webhookEndpoint.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: TENANT_ID,
            url: dto.url,
            secret: expect.stringMatching(/^[a-f0-9]{64}$/), // 32 octets en hex
            actif: true,
          }),
        }),
      );
      // Le secret en clair est retourne une seule fois dans secretPlaintext
      expect(result.secretPlaintext).toBeDefined();
      expect(result.secretPlaintext).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  // ─── lister() ───────────────────────────────────────────────────────────────

  describe('lister()', () => {
    it('retourne les endpoints du tenant sans exposer le secret', async () => {
      const endpointSansSecret = {
        id: mockEndpoint.id,
        url: mockEndpoint.url,
        actif: mockEndpoint.actif,
        evenements: mockEndpoint.evenements,
        description: mockEndpoint.description,
        createdAt: mockEndpoint.createdAt,
      };
      mockPrisma.webhookEndpoint.findMany.mockResolvedValue([endpointSansSecret]);

      const result = await service.lister(TENANT_ID);

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('secret');
      expect(mockPrisma.webhookEndpoint.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: TENANT_ID },
        }),
      );
    });
  });

  // ─── supprimer() ────────────────────────────────────────────────────────────

  describe('supprimer()', () => {
    it("supprime l'endpoint si trouve dans le tenant", async () => {
      mockPrisma.webhookEndpoint.findFirst.mockResolvedValue(mockEndpoint);
      mockPrisma.webhookEndpoint.delete.mockResolvedValue(mockEndpoint);

      await service.supprimer('ep-1', TENANT_ID);

      expect(mockPrisma.webhookEndpoint.delete).toHaveBeenCalledWith({
        where: { id: 'ep-1' },
      });
    });

    it("leve NotFoundException si l'endpoint n'appartient pas au tenant", async () => {
      mockPrisma.webhookEndpoint.findFirst.mockResolvedValue(null);

      await expect(service.supprimer('ep-inconnu', TENANT_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── emettre() ──────────────────────────────────────────────────────────────

  describe('emettre()', () => {
    /**
     * Helper : calcule la signature attendue pour un payload donne.
     */
    function signatureAttendue(secret: string, payload: string): string {
      return `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
    }

    it('construit la signature HMAC-SHA256 correcte dans le header X-Gestmoney-Signature', async () => {
      mockPrisma.webhookEndpoint.findMany.mockResolvedValue([mockEndpoint]);
      mockPrisma.webhookLivraison.create.mockResolvedValue(mockLivraison);
      mockPrisma.webhookLivraison.update.mockResolvedValue({ ...mockLivraison, reussi: true });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('OK'),
      });

      const data = { id: 'tx-99', montant: 5000 };
      await service.emettre(TENANT_ID, 'transaction.created', data);
      await flushPromises();

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const payloadEnvoye = fetchOptions.body as string;
      const headersSig = fetchOptions.headers['X-Gestmoney-Signature'];

      expect(headersSig).toBe(signatureAttendue(SECRET, payloadEnvoye));
    });

    it('envoie un POST avec les headers X-Gestmoney-Signature et X-Gestmoney-Event', async () => {
      mockPrisma.webhookEndpoint.findMany.mockResolvedValue([mockEndpoint]);
      mockPrisma.webhookLivraison.create.mockResolvedValue(mockLivraison);
      mockPrisma.webhookLivraison.update.mockResolvedValue({ ...mockLivraison, reussi: true });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('OK'),
      });

      await service.emettre(TENANT_ID, 'float.low', { agentId: 'agent-1' });
      await flushPromises();

      expect(mockFetch).toHaveBeenCalledWith(
        mockEndpoint.url,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Gestmoney-Signature': expect.stringMatching(/^sha256=[a-f0-9]{64}$/),
            'X-Gestmoney-Event': 'float.low',
          }),
        }),
      );
    });

    it('reessaie en cas d echec HTTP (3 tentatives max)', async () => {
      mockPrisma.webhookEndpoint.findMany.mockResolvedValue([mockEndpoint]);
      mockPrisma.webhookLivraison.create.mockResolvedValue(mockLivraison);
      mockPrisma.webhookLivraison.update.mockResolvedValue({});

      // Toutes les reponses sont des echecs HTTP 500
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error'),
      });

      await service.emettre(TENANT_ID, 'transaction.created', {});
      await flushPromises();

      // Avec setTimeout instantane, les 3 tentatives sont toutes executees
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('enregistre la livraison dans WebhookLivraison en cas de succes', async () => {
      mockPrisma.webhookEndpoint.findMany.mockResolvedValue([mockEndpoint]);
      mockPrisma.webhookLivraison.create.mockResolvedValue(mockLivraison);
      mockPrisma.webhookLivraison.update.mockResolvedValue({ ...mockLivraison, reussi: true });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('OK'),
      });

      await service.emettre(TENANT_ID, 'transaction.created', { id: 'tx-1' });
      await flushPromises();

      expect(mockPrisma.webhookLivraison.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            webhookId: mockEndpoint.id,
            evenement: 'transaction.created',
          }),
        }),
      );
      expect(mockPrisma.webhookLivraison.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockLivraison.id },
          data: expect.objectContaining({ reussi: true, reponseCode: 200 }),
        }),
      );
    });

    it('enregistre reussi=false dans WebhookLivraison en cas d echec reseau', async () => {
      mockPrisma.webhookEndpoint.findMany.mockResolvedValue([mockEndpoint]);
      mockPrisma.webhookLivraison.create.mockResolvedValue(mockLivraison);
      mockPrisma.webhookLivraison.update.mockResolvedValue({});

      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

      await service.emettre(TENANT_ID, 'transaction.created', {});
      await flushPromises();

      expect(mockPrisma.webhookLivraison.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ reussi: false }),
        }),
      );
    });

    it("ne fait aucun appel HTTP si aucun endpoint actif ne correspond a l'evenement", async () => {
      mockPrisma.webhookEndpoint.findMany.mockResolvedValue([]);

      await service.emettre(TENANT_ID, 'agent.created', {});
      await flushPromises();

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
