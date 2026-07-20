import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { LicencesService, ajouterJours, ajouterMois } from './licences.service';
import { PrismaService } from '../prisma/prisma.service';
import { StatutLicence } from './dto/licences.dto';
import { LICENCES_CONFIG_KEY, LicencesConfig } from './licences.config';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

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
  paiement: {
    count: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn((cb: any) => cb(mockPrisma)),
};

const mockConfig = {
  get: jest.fn((cle: string) => (cle === LICENCES_CONFIG_KEY ? CONFIG_TEST : undefined)),
};

/**
 * `tenant.update` renvoie par défaut la fusion du tenant courant et des données
 * écrites — ce que ferait Prisma. Le service construit son résultat à partir de
 * cette valeur de retour, on la simule donc fidèlement.
 */
function brancherUpdate(tenantCourant: any) {
  mockPrisma.tenant.findUnique.mockResolvedValue(tenantCourant);
  mockPrisma.tenant.update.mockImplementation(({ data }: any) =>
    Promise.resolve({ ...tenantCourant, ...data }),
  );
}

/** Extrait les données passées au dernier `tenant.update`. */
function dernierUpdate() {
  return mockPrisma.tenant.update.mock.calls.at(-1)[0].data;
}

/** Extrait les données du dernier `licenceEvent.create`. */
function dernierEvenement() {
  return mockPrisma.licenceEvent.create.mock.calls.at(-1)[0].data;
}

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('LicencesService', () => {
  let service: LicencesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((cb: any) => cb(mockPrisma));
    mockPrisma.licenceEvent.count.mockResolvedValue(0);
    mockPrisma.licenceEvent.create.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicencesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
        // Le service publie les transitions de licence sur le bus ; un double
        // suffit ici, les abonnés ne font pas partie de ce test unitaire.
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<LicencesService>(LicencesService);
  });

  // ─── Renouvellement anticipé (point critique) ───────────────────────────────

  describe('renouveler() — renouvellement anticipé', () => {
    it("ne doit PAS faire perdre les jours restants quand on renouvelle avant l'échéance", async () => {
      // Abonnement courant : il reste exactement 5 jours.
      const echeanceCourante = new Date(Date.now() + 5 * MS_PAR_JOUR);
      brancherUpdate(
        tenantFactory({ subscriptionEndsAt: echeanceCourante, status: 'ACTIVE' }),
      );

      await service.renouveler('tenant-1', { dureeMois: 12 });

      const nouvelleFin: Date = dernierUpdate().subscriptionEndsAt;

      // Attendu : échéance COURANTE + 12 mois, et surtout PAS aujourd'hui + 12 mois.
      expect(nouvelleFin.getTime()).toBe(ajouterMois(echeanceCourante, 12).getTime());

      const depuisAujourdhui = ajouterMois(new Date(), 12);
      expect(nouvelleFin.getTime()).toBeGreaterThan(depuisAujourdhui.getTime());

      // Les 5 jours restants sont bien conservés (tolérance d'une seconde).
      const ecartMs = nouvelleFin.getTime() - depuisAujourdhui.getTime();
      expect(Math.abs(ecartMs - 5 * MS_PAR_JOUR)).toBeLessThan(1000);
    });

    it('doit journaliser un ABONNEMENT_RENOUVELE partant de l’échéance courante', async () => {
      const echeanceCourante = new Date(Date.now() + 5 * MS_PAR_JOUR);
      brancherUpdate(tenantFactory({ subscriptionEndsAt: echeanceCourante }));

      await service.renouveler('tenant-1', { dureeMois: 6, referencePaiement: 'PAY-1' });

      const evenement = dernierEvenement();
      expect(evenement.type).toBe('ABONNEMENT_RENOUVELE');
      expect(evenement.dateDebut.getTime()).toBe(echeanceCourante.getTime());
      expect(evenement.dateFin.getTime()).toBe(ajouterMois(echeanceCourante, 6).getTime());
    });

    it("doit repartir d'aujourd'hui lorsque l'échéance est déjà passée", async () => {
      const echeancePassee = new Date(Date.now() - 10 * MS_PAR_JOUR);
      brancherUpdate(tenantFactory({ subscriptionEndsAt: echeancePassee }));

      const avant = Date.now();
      await service.renouveler('tenant-1', { dureeMois: 12 });
      const nouvelleFin: Date = dernierUpdate().subscriptionEndsAt;

      // On ne facture pas une période déjà écoulée.
      expect(nouvelleFin.getTime()).toBeGreaterThan(ajouterMois(new Date(avant - 1000), 12).getTime());
      expect(nouvelleFin.getTime()).toBeGreaterThan(Date.now());
    });

    it('doit repartir de l’échéance courante lors d’activations successives', async () => {
      const echeance = new Date(Date.now() + 30 * MS_PAR_JOUR);
      brancherUpdate(tenantFactory({ subscriptionEndsAt: echeance }));

      await service.activerDepuisPaiement({ tenantId: 'tenant-1', dureeMois: 1 });

      expect(dernierUpdate().subscriptionEndsAt.getTime()).toBe(
        ajouterMois(echeance, 1).getTime(),
      );
    });

    it('doit refuser une durée non entière ou négative', async () => {
      brancherUpdate(tenantFactory());
      await expect(service.renouveler('tenant-1', { dureeMois: 0 })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.renouveler('tenant-1', { dureeMois: -3 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── Essai unique ───────────────────────────────────────────────────────────

  describe('activerEssai() — essai non rejouable', () => {
    it("doit ouvrir un essai de 14 jours par défaut", async () => {
      brancherUpdate(tenantFactory());

      const resultat = await service.activerEssai('tenant-1');

      const data = dernierUpdate();
      expect(data.status).toBe('TRIAL');
      const attendu = ajouterJours(new Date(), 14).getTime();
      expect(Math.abs(data.trialEndsAt.getTime() - attendu)).toBeLessThan(2000);
      expect(dernierEvenement().type).toBe('ESSAI_ACTIVE');
      expect(resultat.statut).toBe(StatutLicence.ESSAI);
      expect(resultat.essaiConsomme).toBe(true);
    });

    it("doit REFUSER un second essai si un ESSAI_ACTIVE existe déjà", async () => {
      brancherUpdate(tenantFactory());
      mockPrisma.licenceEvent.count.mockResolvedValue(1); // essai antérieur

      await expect(service.activerEssai('tenant-1')).rejects.toThrow(ConflictException);
      expect(mockPrisma.tenant.update).not.toHaveBeenCalled();
      expect(mockPrisma.licenceEvent.create).not.toHaveBeenCalled();
    });

    it("doit REFUSER un second essai si le drapeau essaiConsomme est posé", async () => {
      // Cas d'un essai terminé depuis longtemps : l'événement pourrait avoir été
      // purgé, le drapeau dans `settings` reste le garde-fou.
      brancherUpdate(
        tenantFactory({
          status: 'EXPIRED',
          trialEndsAt: new Date(Date.now() - 60 * MS_PAR_JOUR),
          settings: { licence: { essaiConsomme: true, statut: StatutLicence.EXPIREE } },
        }),
      );
      mockPrisma.licenceEvent.count.mockResolvedValue(0);

      await expect(service.activerEssai('tenant-1')).rejects.toThrow(ConflictException);
      expect(mockPrisma.tenant.update).not.toHaveBeenCalled();
    });

    it('doit honorer une durée d’essai personnalisée', async () => {
      brancherUpdate(tenantFactory());
      await service.activerEssai('tenant-1', { dureeJours: 30 });

      const attendu = ajouterJours(new Date(), 30).getTime();
      expect(Math.abs(dernierUpdate().trialEndsAt.getTime() - attendu)).toBeLessThan(2000);
    });
  });

  // ─── Licence provisoire plafonnée ───────────────────────────────────────────

  describe('accorderLicenceProvisoire() — plafond de 14 jours', () => {
    it('doit accepter une durée inférieure ou égale au plafond', async () => {
      brancherUpdate(tenantFactory());

      const resultat = await service.accorderLicenceProvisoire('tenant-1', 14, 'Chèque reçu');

      expect(resultat.statut).toBe(StatutLicence.PROVISOIRE);
      expect(dernierUpdate().status).toBe('ACTIVE');
      expect(dernierEvenement().motif).toContain('LICENCE PROVISOIRE');
    });

    it('doit REFUSER une durée au-delà du plafond, sans tronquer silencieusement', async () => {
      brancherUpdate(tenantFactory());

      await expect(
        service.accorderLicenceProvisoire('tenant-1', 15, 'Trop long'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.accorderLicenceProvisoire('tenant-1', 90, 'Beaucoup trop long'),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.tenant.update).not.toHaveBeenCalled();
      expect(mockPrisma.licenceEvent.create).not.toHaveBeenCalled();
    });

    it('doit REFUSER une durée nulle ou négative', async () => {
      brancherUpdate(tenantFactory());
      await expect(service.accorderLicenceProvisoire('tenant-1', 0, 'x')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── Suspension / réactivation / révocation ─────────────────────────────────

  describe('suspendre() / reactiver() / revoquer()', () => {
    it('doit suspendre une licence active et journaliser l’événement', async () => {
      brancherUpdate(
        tenantFactory({ subscriptionEndsAt: new Date(Date.now() + 30 * MS_PAR_JOUR) }),
      );

      const resultat = await service.suspendre('tenant-1', 'Impayé', 'agent-1');

      expect(dernierUpdate().status).toBe('SUSPENDED');
      expect(dernierEvenement().type).toBe('ABONNEMENT_SUSPENDU');
      expect(resultat.statut).toBe(StatutLicence.SUSPENDUE);
      expect(resultat.actif).toBe(false);
    });

    it('doit refuser de suspendre une licence déjà suspendue', async () => {
      brancherUpdate(tenantFactory({ status: 'SUSPENDED' }));
      await expect(service.suspendre('tenant-1', 'Encore')).rejects.toThrow(ConflictException);
    });

    it('doit restituer le statut ACTIVE à la réactivation si l’échéance court encore', async () => {
      brancherUpdate(
        tenantFactory({
          status: 'SUSPENDED',
          subscriptionEndsAt: new Date(Date.now() + 30 * MS_PAR_JOUR),
          settings: { licence: { statut: StatutLicence.SUSPENDUE } },
        }),
      );

      const resultat = await service.reactiver('tenant-1', 'Régularisé');

      expect(dernierUpdate().status).toBe('ACTIVE');
      expect(dernierEvenement().type).toBe('ABONNEMENT_REACTIVE');
      expect(resultat.statut).toBe(StatutLicence.ACTIVE);
    });

    it('doit rendre une licence révoquée non réactivable', async () => {
      brancherUpdate(
        tenantFactory({
          status: 'EXPIRED',
          settings: { licence: { statut: StatutLicence.REVOQUEE } },
        }),
      );
      await expect(service.reactiver('tenant-1', 'Tentative')).rejects.toThrow(
        ConflictException,
      );
    });

    it('doit effacer l’échéance à la révocation', async () => {
      brancherUpdate(
        tenantFactory({ subscriptionEndsAt: new Date(Date.now() + 90 * MS_PAR_JOUR) }),
      );

      const resultat = await service.revoquer('tenant-1', 'Fraude', 'agent-1');

      const data = dernierUpdate();
      expect(data.status).toBe('EXPIRED');
      expect(data.subscriptionEndsAt).toBeNull();
      expect(dernierEvenement().motif).toContain('RÉVOCATION');
      expect(resultat.statut).toBe(StatutLicence.REVOQUEE);
    });
  });

  // ─── Changement de plan ─────────────────────────────────────────────────────

  describe('changerPlan()', () => {
    it('doit journaliser un UPGRAYE vers un plan supérieur', async () => {
      brancherUpdate(tenantFactory({ plan: 'STARTER' }));
      await service.changerPlan('tenant-1', 'PROFESSIONAL' as any);
      expect(dernierEvenement().type).toBe('ABONNEMENT_UPGRAYE');
    });

    it('doit journaliser un DEGRADE vers un plan inférieur', async () => {
      brancherUpdate(tenantFactory({ plan: 'ENTERPRISE' }));
      await service.changerPlan('tenant-1', 'STARTER' as any);
      expect(dernierEvenement().type).toBe('ABONNEMENT_DEGRADE');
    });

    it('ne doit pas toucher à l’échéance', async () => {
      const echeance = new Date(Date.now() + 60 * MS_PAR_JOUR);
      brancherUpdate(tenantFactory({ plan: 'STARTER', subscriptionEndsAt: echeance }));
      await service.changerPlan('tenant-1', 'ENTERPRISE' as any);
      expect(dernierUpdate().subscriptionEndsAt).toBeUndefined();
    });

    it('doit refuser un changement vers le plan déjà en cours', async () => {
      brancherUpdate(tenantFactory({ plan: 'STARTER' }));
      await expect(service.changerPlan('tenant-1', 'STARTER' as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── Période de grâce et idempotence ────────────────────────────────────────

  describe('basculerEnGrace() — idempotence', () => {
    it('doit ouvrir une grâce de 7 jours après l’échéance', async () => {
      const echeance = new Date(Date.now() - 1 * MS_PAR_JOUR);
      brancherUpdate(
        tenantFactory({ subscriptionEndsAt: echeance, settings: { licence: {} } }),
      );

      const traite = await service.basculerEnGrace('tenant-1');

      expect(traite).toBe(true);
      expect(dernierEvenement().type).toBe('PERIODE_GRACE_ACTIVEE');
      const meta = dernierUpdate().settings.licence;
      expect(meta.statut).toBe(StatutLicence.GRACE);
      expect(new Date(meta.graceJusquA).getTime()).toBe(ajouterJours(echeance, 7).getTime());
    });

    it('ne doit RIEN refaire au second passage (pas de doublon d’événement)', async () => {
      const echeance = new Date(Date.now() - 1 * MS_PAR_JOUR);
      const graceJusquA = ajouterJours(echeance, 7).toISOString();
      brancherUpdate(
        tenantFactory({
          subscriptionEndsAt: echeance,
          settings: { licence: { statut: StatutLicence.GRACE, graceJusquA } },
        }),
      );

      const traite = await service.basculerEnGrace('tenant-1');

      expect(traite).toBe(false);
      expect(mockPrisma.tenant.update).not.toHaveBeenCalled();
      expect(mockPrisma.licenceEvent.create).not.toHaveBeenCalled();
    });

    it('ne doit pas basculer une licence encore valide', async () => {
      brancherUpdate(
        tenantFactory({ subscriptionEndsAt: new Date(Date.now() + 10 * MS_PAR_JOUR) }),
      );
      expect(await service.basculerEnGrace('tenant-1')).toBe(false);
      expect(mockPrisma.licenceEvent.create).not.toHaveBeenCalled();
    });
  });

  describe('expirerFinDeGrace() — idempotence', () => {
    it('doit couper l’accès quand la grâce est écoulée', async () => {
      brancherUpdate(
        tenantFactory({
          subscriptionEndsAt: new Date(Date.now() - 10 * MS_PAR_JOUR),
          settings: {
            licence: {
              statut: StatutLicence.GRACE,
              graceJusquA: new Date(Date.now() - MS_PAR_JOUR).toISOString(),
            },
          },
        }),
      );

      expect(await service.expirerFinDeGrace('tenant-1')).toBe(true);
      expect(dernierUpdate().status).toBe('EXPIRED');
      expect(dernierEvenement().type).toBe('ABONNEMENT_EXPIRE');
    });

    it('ne doit pas retraiter une licence déjà expirée', async () => {
      brancherUpdate(
        tenantFactory({
          status: 'EXPIRED',
          settings: { licence: { statut: StatutLicence.EXPIREE, graceJusquA: null } },
        }),
      );

      expect(await service.expirerFinDeGrace('tenant-1')).toBe(false);
      expect(mockPrisma.licenceEvent.create).not.toHaveBeenCalled();
    });

    it('ne doit pas couper l’accès avant la fin de la grâce', async () => {
      brancherUpdate(
        tenantFactory({
          settings: {
            licence: {
              statut: StatutLicence.GRACE,
              graceJusquA: new Date(Date.now() + 3 * MS_PAR_JOUR).toISOString(),
            },
          },
        }),
      );
      expect(await service.expirerFinDeGrace('tenant-1')).toBe(false);
    });
  });

  // ─── Rappels : verrou d'idempotence ─────────────────────────────────────────

  describe('marquerRappelEnvoye() — idempotence des rappels', () => {
    it("doit autoriser un rappel J-7 puis le refuser au passage suivant", async () => {
      const echeance = new Date(Date.now() + 7 * MS_PAR_JOUR);
      brancherUpdate(tenantFactory({ subscriptionEndsAt: echeance }));

      expect(await service.marquerRappelEnvoye('tenant-1', 7)).toBe(true);

      // Second passage : le marqueur écrit est désormais présent.
      const metaEcrite = dernierUpdate().settings.licence;
      brancherUpdate(
        tenantFactory({ subscriptionEndsAt: echeance, settings: { licence: metaEcrite } }),
      );

      expect(await service.marquerRappelEnvoye('tenant-1', 7)).toBe(false);
    });

    it('doit autoriser un rappel J-3 distinct après un J-7 déjà envoyé', async () => {
      const echeance = new Date(Date.now() + 3 * MS_PAR_JOUR);
      brancherUpdate(
        tenantFactory({
          subscriptionEndsAt: echeance,
          settings: { licence: { rappelsEnvoyes: { [echeance.toISOString()]: [7] } } },
        }),
      );

      expect(await service.marquerRappelEnvoye('tenant-1', 3)).toBe(true);
    });

    it('doit réarmer les rappels après un renouvellement (nouveau cycle)', async () => {
      const ancienneEcheance = new Date(Date.now() + 5 * MS_PAR_JOUR);
      brancherUpdate(
        tenantFactory({
          subscriptionEndsAt: ancienneEcheance,
          settings: {
            licence: { rappelsEnvoyes: { [ancienneEcheance.toISOString()]: [7, 3] } },
          },
        }),
      );

      await service.renouveler('tenant-1', { dureeMois: 12 });

      // Le renouvellement purge les marqueurs du cycle précédent.
      expect(dernierUpdate().settings.licence.rappelsEnvoyes).toEqual({});
    });
  });

  // ─── Statut consolidé ───────────────────────────────────────────────────────

  describe('getStatutLicence()', () => {
    it('doit déduire ACTIVE et calculer les jours restants', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(
        tenantFactory({ subscriptionEndsAt: new Date(Date.now() + 10 * MS_PAR_JOUR) }),
      );

      const resultat = await service.getStatutLicence('tenant-1');

      expect(resultat.statut).toBe(StatutLicence.ACTIVE);
      expect(resultat.actif).toBe(true);
      expect(resultat.joursRestants).toBe(10);
    });

    it('doit déduire EXPIREE quand toutes les dates sont passées', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(
        tenantFactory({
          status: 'EXPIRED',
          subscriptionEndsAt: new Date(Date.now() - MS_PAR_JOUR),
        }),
      );

      const resultat = await service.getStatutLicence('tenant-1');
      expect(resultat.statut).toBe(StatutLicence.EXPIREE);
      expect(resultat.actif).toBe(false);
      expect(resultat.joursRestants).toBe(0);
    });

    it("doit laisser l'accès ouvert pendant la période de grâce", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(
        tenantFactory({
          subscriptionEndsAt: new Date(Date.now() - MS_PAR_JOUR),
          settings: {
            licence: {
              statut: StatutLicence.GRACE,
              graceJusquA: new Date(Date.now() + 6 * MS_PAR_JOUR).toISOString(),
            },
          },
        }),
      );

      const resultat = await service.getStatutLicence('tenant-1');
      expect(resultat.statut).toBe(StatutLicence.GRACE);
      expect(resultat.actif).toBe(true);
    });

    it('doit faire primer la révocation sur toute date encore valide', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(
        tenantFactory({
          subscriptionEndsAt: new Date(Date.now() + 100 * MS_PAR_JOUR),
          settings: { licence: { statut: StatutLicence.REVOQUEE } },
        }),
      );

      const resultat = await service.getStatutLicence('tenant-1');
      expect(resultat.statut).toBe(StatutLicence.REVOQUEE);
      expect(resultat.actif).toBe(false);
    });
  });

  // ─── Atomicité ──────────────────────────────────────────────────────────────

  describe('atomicité', () => {
    it('doit exécuter chaque transition dans une transaction', async () => {
      brancherUpdate(tenantFactory());
      await service.activerEssai('tenant-1');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  // ─── Utilitaires de dates ───────────────────────────────────────────────────

  describe('ajouterMois()', () => {
    it('doit retomber sur le dernier jour utile pour un 31 vers un mois court', () => {
      const resultat = ajouterMois(new Date('2026-01-31T10:00:00.000Z'), 1);
      expect(resultat.getMonth()).toBe(1); // février, pas mars
    });

    it('doit rester stable sur un mois plein', () => {
      const resultat = ajouterMois(new Date('2026-01-15T10:00:00.000Z'), 12);
      expect(resultat.getFullYear()).toBe(2027);
      expect(resultat.getMonth()).toBe(0);
      expect(resultat.getDate()).toBe(15);
    });
  });
});
