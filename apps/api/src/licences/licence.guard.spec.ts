import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LicenceGuard, CorpsLicenceRefusee } from './licence.guard';
import { SANS_LICENCE_KEY } from '../common/decorators/sans-licence.decorator';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { RoleType } from '../common/enums/role.enum';
import { StatutLicence, StatutLicenceResultat } from './dto/licences.dto';

/**
 * ⚠️ NON EXÉCUTÉ : `jest` échoue au parsing des décorateurs dans `apps/api`
 * (problème préexistant à ce module, indépendant de ces tests). Le fichier est
 * écrit pour être vert dès que la configuration Jest/ts-jest sera réparée.
 */

const TENANT = 'tenant-1';

function statut(s: StatutLicence, extra: Partial<StatutLicenceResultat> = {}) {
  return {
    tenantId: TENANT,
    statut: s,
    plan: 'STARTER',
    actif: false,
    trialEndsAt: null,
    subscriptionEndsAt: new Date('2026-01-31T00:00:00.000Z'),
    graceJusquA: null,
    provisoireJusquA: null,
    joursRestants: 0,
    essaiConsomme: true,
    motif: null,
    ...extra,
  } as StatutLicenceResultat;
}

/** Contexte HTTP minimal. `user` déjà présent ⇒ pas de décodage de JWT. */
function contexte(options: {
  user?: { tenantId?: string; roles?: string[] } | undefined;
  metadonnees?: Record<string, unknown>;
  type?: string;
}): { ctx: ExecutionContext; reflector: Reflector } {
  const meta = options.metadonnees ?? {};
  const reflector = {
    getAllAndOverride: (cle: string) => meta[cle],
  } as unknown as Reflector;

  const ctx = {
    getType: () => options.type ?? 'http',
    getHandler: () => function handler() {},
    getClass: () => class Controleur {},
    switchToHttp: () => ({
      getRequest: () => ({ user: options.user, headers: {}, cookies: {} }),
    }),
  } as unknown as ExecutionContext;

  return { ctx, reflector };
}

function construireGarde(
  reflector: Reflector,
  resultat: StatutLicenceResultat | Error,
) {
  const licences = {
    getStatutLicenceCache: jest.fn(async () => {
      if (resultat instanceof Error) throw resultat;
      return resultat;
    }),
  };
  const jwtService = { verify: jest.fn(() => ({})) };
  const config = { get: jest.fn((_c: string, defaut?: string) => defaut) };

  const garde = new LicenceGuard(
    reflector,
    licences as never,
    jwtService as never,
    config as never,
  );
  return { garde, licences, jwtService };
}

describe('LicenceGuard', () => {
  const utilisateur = { tenantId: TENANT, roles: [RoleType.AGENT] };

  // ── Statuts qui ouvrent l'accès ─────────────────────────────────────────────
  describe.each([
    StatutLicence.ESSAI,
    StatutLicence.PROVISOIRE,
    StatutLicence.ACTIVE,
    StatutLicence.GRACE,
  ])('statut %s', (s) => {
    it('laisse passer', async () => {
      const { ctx, reflector } = contexte({ user: utilisateur });
      const { garde } = construireGarde(reflector, statut(s, { actif: true }));
      await expect(garde.canActivate(ctx)).resolves.toBe(true);
    });
  });

  it('GRACE laisse passer : la période de grâce sert à laisser le temps de renouveler', async () => {
    const { ctx, reflector } = contexte({ user: utilisateur });
    const { garde } = construireGarde(
      reflector,
      statut(StatutLicence.GRACE, { actif: true, joursRestants: 3 }),
    );
    await expect(garde.canActivate(ctx)).resolves.toBe(true);
  });

  // ── Statuts qui ferment l'accès ─────────────────────────────────────────────
  describe.each([
    StatutLicence.EN_ATTENTE_PAIEMENT,
    StatutLicence.EXPIREE,
    StatutLicence.SUSPENDUE,
    StatutLicence.REVOQUEE,
  ])('statut %s', (s) => {
    it('refuse avec un 402 explicite', async () => {
      const { ctx, reflector } = contexte({ user: utilisateur });
      const { garde } = construireGarde(reflector, statut(s));

      await expect(garde.canActivate(ctx)).rejects.toBeInstanceOf(HttpException);

      try {
        await garde.canActivate(ctx);
        fail('la garde aurait dû refuser');
      } catch (erreur) {
        const http = erreur as HttpException;
        expect(http.getStatus()).toBe(HttpStatus.PAYMENT_REQUIRED);
        const corps = http.getResponse() as CorpsLicenceRefusee;
        expect(corps.code).toBe('LICENCE_INACTIVE');
        expect(corps.statut).toBe(s);
        expect(corps.dateFin).toBe('2026-01-31T00:00:00.000Z');
        expect(corps.renouvellementUrl).toBe('/dashboard/abonnement');
        expect(typeof corps.message).toBe('string');
      }
    });
  });

  // ── LE cas critique : l'exemption ───────────────────────────────────────────
  describe('exemption @SansLicence()', () => {
    it('une licence EXPIREE atteint quand même les routes de paiement', async () => {
      const { ctx, reflector } = contexte({
        user: utilisateur,
        metadonnees: { [SANS_LICENCE_KEY]: true },
      });
      const { garde, licences } = construireGarde(
        reflector,
        statut(StatutLicence.EXPIREE),
      );

      await expect(garde.canActivate(ctx)).resolves.toBe(true);
      // Court-circuit total : aucune lecture de statut n'est même tentée.
      expect(licences.getStatutLicenceCache).not.toHaveBeenCalled();
    });

    it.each([
      StatutLicence.REVOQUEE,
      StatutLicence.SUSPENDUE,
      StatutLicence.EN_ATTENTE_PAIEMENT,
    ])('%s reste exemptée elle aussi', async (s) => {
      const { ctx, reflector } = contexte({
        user: utilisateur,
        metadonnees: { [SANS_LICENCE_KEY]: true },
      });
      const { garde } = construireGarde(reflector, statut(s));
      await expect(garde.canActivate(ctx)).resolves.toBe(true);
    });
  });

  // ── Comportements défensifs ─────────────────────────────────────────────────
  describe('cas limites', () => {
    it("laisse passer quand `req.user` est absent et qu'aucun token n'est joignable", async () => {
      const { ctx, reflector } = contexte({ user: undefined });
      const { garde, licences } = construireGarde(
        reflector,
        statut(StatutLicence.EXPIREE),
      );
      // Ce n'est pas le rôle de cette garde de renvoyer un 401 : JwtAuthGuard
      // s'en charge juste après.
      await expect(garde.canActivate(ctx)).resolves.toBe(true);
      expect(licences.getStatutLicenceCache).not.toHaveBeenCalled();
    });

    it('laisse passer une route @Public()', async () => {
      const { ctx, reflector } = contexte({
        user: utilisateur,
        metadonnees: { [IS_PUBLIC_KEY]: true },
      });
      const { garde } = construireGarde(reflector, statut(StatutLicence.EXPIREE));
      await expect(garde.canActivate(ctx)).resolves.toBe(true);
    });

    it('laisse passer le SUPER_ADMIN, qui administre les licences des autres', async () => {
      const { ctx, reflector } = contexte({
        user: { tenantId: TENANT, roles: [RoleType.SUPER_ADMIN] },
      });
      const { garde } = construireGarde(reflector, statut(StatutLicence.EXPIREE));
      await expect(garde.canActivate(ctx)).resolves.toBe(true);
    });

    it('laisse passer hors contexte HTTP (WebSocket, tâches planifiées)', async () => {
      const { ctx, reflector } = contexte({ user: utilisateur, type: 'ws' });
      const { garde } = construireGarde(reflector, statut(StatutLicence.EXPIREE));
      await expect(garde.canActivate(ctx)).resolves.toBe(true);
    });

    it("ne bloque pas l'application quand le statut est illisible (panne base)", async () => {
      const { ctx, reflector } = contexte({ user: utilisateur });
      const { garde } = construireGarde(reflector, new Error('base indisponible'));
      // Une panne d'infrastructure ne doit pas se muer en refus de paiement
      // généralisé pour tous les clients à jour.
      await expect(garde.canActivate(ctx)).resolves.toBe(true);
    });

    it('remonte la fin de grâce comme dateFin quand il n’y a pas d’échéance d’abonnement', async () => {
      const { ctx, reflector } = contexte({ user: utilisateur });
      const { garde } = construireGarde(
        reflector,
        statut(StatutLicence.EXPIREE, {
          subscriptionEndsAt: null,
          graceJusquA: new Date('2026-02-07T00:00:00.000Z'),
        }),
      );
      try {
        await garde.canActivate(ctx);
        fail('la garde aurait dû refuser');
      } catch (erreur) {
        const corps = (erreur as HttpException).getResponse() as CorpsLicenceRefusee;
        expect(corps.dateFin).toBe('2026-02-07T00:00:00.000Z');
      }
    });
  });
});
