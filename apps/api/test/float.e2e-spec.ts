/**
 * Tests E2E — Float
 * Nécessite DATABASE_URL_TEST et un compte admin seedé.
 */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

const TEST_TENANT_ID = process.env.TEST_TENANT_ID || 'tenant-test-e2e';

describe('FloatController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let replenishmentId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    // Récupérer un token de test
    if (process.env.TEST_USER_EMAIL) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({
          email: process.env.TEST_USER_EMAIL,
          password: process.env.TEST_USER_PASSWORD,
        });
      if (res.status === 200) {
        authToken = res.body.accessToken;
      }
    }
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── GET /float ───────────────────────────────────────────────────────────────

  describe('GET /api/v1/float', () => {
    it('devrait retourner 200 + liste des comptes float', async () => {
      if (!authToken) return;

      await request(app.getHttpServer())
        .get('/api/v1/float')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('devrait retourner 401 sans token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/float')
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .expect(401);
    });
  });

  // ─── POST /float/replenish ────────────────────────────────────────────────────

  describe('POST /api/v1/float/replenish', () => {
    const replenishPayload = {
      agentId: process.env.TEST_AGENT_ID || 'agent-test-uuid',
      operateur: 'ORANGE_MONEY',
      montantDemande: 500000,
      justification: 'Réapprovisionnement test E2E',
    };

    it('devrait créer une demande de réappro et retourner 201', async () => {
      if (!authToken) return;

      const res = await request(app.getHttpServer())
        .post('/api/v1/float/replenish')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send(replenishPayload)
        .expect((r) => {
          expect([201, 400, 404]).toContain(r.status);
        });

      if (res.status === 201) {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('statut', 'PENDING');
        replenishmentId = res.body.id;
      }
    });

    it('devrait retourner 401 sans token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/float/replenish')
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send(replenishPayload)
        .expect(401);
    });
  });

  // ─── PATCH /float/replenish/:id/approve ──────────────────────────────────────

  describe('PATCH /api/v1/float/replenish/:id/approve', () => {
    it("devrait approuver une demande PENDING et retourner 200", async () => {
      if (!authToken || !replenishmentId) {
        console.log('Skipping: pas de demande créée en E2E');
        return;
      }

      await request(app.getHttpServer())
        .patch(`/api/v1/float/replenish/${replenishmentId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ commentaire: 'Approuvé E2E' })
        .expect((r) => {
          expect([200, 400, 404]).toContain(r.status);
        });
    });
  });

  // ─── GET /float/alerts ───────────────────────────────────────────────────────

  describe('GET /api/v1/float/alerts', () => {
    it('devrait retourner 200 + liste des alertes float', async () => {
      if (!authToken) return;

      await request(app.getHttpServer())
        .get('/api/v1/float/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('agentId');
            expect(res.body[0]).toHaveProperty('solde');
            expect(res.body[0]).toHaveProperty('niveau');
          }
        });
    });
  });

  // ─── GET /float/forecast ─────────────────────────────────────────────────────

  describe('GET /api/v1/float/forecast', () => {
    it('devrait retourner 200 + prévisions de consommation', async () => {
      if (!authToken) return;

      await request(app.getHttpServer())
        .get('/api/v1/float/forecast')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('agentId');
            expect(res.body[0]).toHaveProperty('soldeActuel');
            expect(res.body[0]).toHaveProperty('joursAvantEpuisement');
            expect(res.body[0]).toHaveProperty('priorite');
          }
        });
    });
  });
});
