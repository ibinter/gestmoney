import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ForbiddenException } from '@nestjs/common';
import { LicencesService } from './licences.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StatutLicence } from './dto/licences.dto';
import { LICENCES_CONFIG_KEY, LicencesConfig } from './licences.config';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
//
// Même style de mocks que `licences.service.spec.ts` (mockPrisma, tenantFactory),
// enrichi des compteurs `agency`/`agent`/`transaction` dont dépend le palier
// Découverte (getQuotas / assurerQuota comptent directement en base).

const CONFIG_TEST: LicencesConfig = {
  essaiJours: 14,
  graceJours: 7,
  provisoireMaxJours: 14,
  paiementExpirationHeures: 48,
  rappelsJours: [7, 3, 1],
};

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

function tenantFactory(overrides: Record<string, any> = {}) {
  return {
    id: 'tenant-1',
    name: 'Agence Test',
    plan: 'STARTER',
    status: 'ACTIVE',
    currency: 'XOF',
    trialEndsAt: null,
    subscriptionEndsAt: null,
    settings: {},
    ...overrides,
  };
}

const mockPrisma: any = {
  tenant: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  licenceEvent: {
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  agency: { count: jest.fn() },
  agent: { count: jest.fn() },
  transaction: { count: jest.fn() },
  user: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  $transaction: jest.fn((cb: any) => cb(mockPrisma)),
};

const mockConfig = {
  get: jest.fn((cle: string) => (cle === LICENCES_CONFIG_KEY ? CONFIG_TEST : undefined)),
};

/** Fixe les trois compteurs de quota (par défaut à 0). */
function brancherCompteurs({ agences = 0, agents = 0, transactionsMois = 0 } = {}) {
  mockPrisma.agency.count.mockResolvedValue(agences);
  mockPrisma.agent.count.mockResolvedValue(agents);
  mockPrisma.transaction.count.mockResolvedValue(transactionsMois);
}

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('LicencesService — palier Découverte (quotas)', () => {
  let service: LicencesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((cb: any) => cb(mockPrisma));
    mockPrisma.licenceEvent.count.mockResolvedValue(0);
    mockPrisma.licenceEvent.create.mockResolvedValue({});
    brancherCompteurs();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicencesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: NotificationsService, useValue: { sendEmail: jest.fn() } },
      ],
    }).compile();

    service = module.get<LicencesService>(LicencesService);
  });

  // ─── Déduction du statut DECOUVERTE ─────────────────────────────────────────

  describe('getStatutLicence() — atterrissage en DECOUVERTE', () => {
    it("doit déduire DECOUVERTE quand aucun abonnement n'a jamais été souscrit (essai jamais ouvert)", async () => {
      // Ni essai, ni abonnement, ni meta : palier gratuit par défaut.
      mockPrisma.tenant.findUnique.mockResolvedValue(
        tenantFactory({ trialEndsAt: null, subscriptionEndsAt: null, settings: {} }),
      );

      const resultat = await service.getStatutLicence('tenant-1');

      expect(resultat.statut).toBe(StatutLicence.DECOUVERTE);
      expect(resultat.actif).toBe(true);
    });

    it("doit déduire DECOUVERTE quand l'essai est terminé sans abonnement souscrit", async () => {
      // Essai consommé et échu, jamais d'abonnement payant : bascule en Découverte
      // (cahier IBIG D6 : jamais de coupure), et non en EXPIREE.
      mockPrisma.tenant.findUnique.mockResolvedValue(
        tenantFactory({
          status: 'TRIAL',
          trialEndsAt: new Date(Date.now() - 3 * MS_PAR_JOUR),
          subscriptionEndsAt: null,
          settings: { licence: { essaiConsomme: true } },
        }),
      );

      const resultat = await service.getStatutLicence('tenant-1');

      expect(resultat.statut).toBe(StatutLicence.DECOUVERTE);
      expect(resultat.actif).toBe(true);
    });

    it('RÉGRESSION : un abonnement souscrit puis échu reste EXPIREE (jamais DECOUVERTE)', async () => {
      // subscriptionEndsAt renseignée mais passée : l'abonnement a bien existé,
      // il expire. Il ne doit PAS retomber dans le palier gratuit.
      mockPrisma.tenant.findUnique.mockResolvedValue(
        tenantFactory({
          status: 'EXPIRED',
          subscriptionEndsAt: new Date(Date.now() - MS_PAR_JOUR),
        }),
      );

      const resultat = await service.getStatutLicence('tenant-1');

      expect(resultat.statut).toBe(StatutLicence.EXPIREE);
      expect(resultat.actif).toBe(false);
    });
  });

  // ─── getQuotas() — plafonds du palier gratuit ───────────────────────────────

  describe('getQuotas() — plafonds 1 / 1 / 25 en DECOUVERTE', () => {
    it('doit exposer les plafonds Découverte avec le reste calculé', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(
        tenantFactory({ trialEndsAt: null, subscriptionEndsAt: null, settings: {} }),
      );
      brancherCompteurs({ agences: 0, agents: 0, transactionsMois: 0 });

      const quotas = await service.getQuotas('tenant-1');
      const par = Object.fromEntries(quotas.map((q) => [q.compteur, q]));

      expect(par.agences.plafond).toBe(1);
      expect(par.agents.plafond).toBe(1);
      expect(par.transactionsMois.plafond).toBe(25);

      // À vide, tout est autorisé et le reste vaut le plafond.
      expect(par.agences.restant).toBe(1);
      expect(par.agents.restant).toBe(1);
      expect(par.transactionsMois.restant).toBe(25);
      expect(quotas.every((q) => q.autorise)).toBe(true);
    });

    it('doit rapporter autorise=false et restant=0 lorsqu’un compteur est au plafond', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(
        tenantFactory({ trialEndsAt: null, subscriptionEndsAt: null, settings: {} }),
      );
      brancherCompteurs({ agences: 1, agents: 0, transactionsMois: 25 });

      const quotas = await service.getQuotas('tenant-1');
      const par = Object.fromEntries(quotas.map((q) => [q.compteur, q]));

      expect(par.agences.autorise).toBe(false);
      expect(par.agences.restant).toBe(0);
      expect(par.transactionsMois.autorise).toBe(false);
      expect(par.transactionsMois.restant).toBe(0);
      // Le compteur agents a encore de la marge.
      expect(par.agents.autorise).toBe(true);
    });

    it('hors DECOUVERTE, les plafonds sont infinis et tout est autorisé', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(
        tenantFactory({ subscriptionEndsAt: new Date(Date.now() + 30 * MS_PAR_JOUR) }),
      );
      brancherCompteurs({ agences: 42, agents: 99, transactionsMois: 5000 });

      const quotas = await service.getQuotas('tenant-1');

      expect(quotas.every((q) => q.plafond === Number.POSITIVE_INFINITY)).toBe(true);
      expect(quotas.every((q) => q.restant === Number.POSITIVE_INFINITY)).toBe(true);
      expect(quotas.every((q) => q.autorise)).toBe(true);
    });
  });

  // ─── assurerQuota() — garde d'écriture ──────────────────────────────────────

  describe('assurerQuota() — garde d’écriture du palier Découverte', () => {
    it('doit LAISSER PASSER quand le compteur est sous le plafond en DECOUVERTE', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(
        tenantFactory({ trialEndsAt: null, subscriptionEndsAt: null, settings: {} }),
      );
      brancherCompteurs({ agences: 0 });

      await expect(service.assurerQuota('tenant-1', 'agences')).resolves.toBeUndefined();
    });

    it('doit LEVER ForbiddenException quand le compteur atteint le plafond en DECOUVERTE', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(
        tenantFactory({ trialEndsAt: null, subscriptionEndsAt: null, settings: {} }),
      );
      brancherCompteurs({ agences: 1 }); // plafond agences = 1, déjà atteint

      await expect(service.assurerQuota('tenant-1', 'agences')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('doit LEVER ForbiddenException au plafond des transactions mensuelles (25)', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(
        tenantFactory({ trialEndsAt: null, subscriptionEndsAt: null, settings: {} }),
      );
      brancherCompteurs({ transactionsMois: 25 });

      await expect(
        service.assurerQuota('tenant-1', 'transactionsMois'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('ne doit JAMAIS bloquer un tenant hors DECOUVERTE, même très au-dessus des plafonds', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(
        tenantFactory({ subscriptionEndsAt: new Date(Date.now() + 30 * MS_PAR_JOUR) }),
      );
      brancherCompteurs({ agences: 1000, agents: 1000, transactionsMois: 1000 });

      await expect(service.assurerQuota('tenant-1', 'agences')).resolves.toBeUndefined();
      await expect(service.assurerQuota('tenant-1', 'agents')).resolves.toBeUndefined();
      await expect(
        service.assurerQuota('tenant-1', 'transactionsMois'),
      ).resolves.toBeUndefined();
    });
  });
});
