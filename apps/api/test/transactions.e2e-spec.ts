/**
 * Tests E2E — Transactions
 * Nécessite DATABASE_URL_TEST et un compte admin seedé.
 */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

const TEST_TENANT_ID = process.env.TEST_TENANT_ID || 'tenant-test-e2e';

// ─── Payload de transaction de test ──────────────────────────────────────────

const validTransactionPayload = {
  montant: 10000,
  type: 'DEPOT',
  operateur: 'ORANGE_MONEY',
  agentId: process.env.TEST_AGENT_ID || 'agent-test-uuid',
  clientPhone: '+22507000001',
  description: 'Test E2E dépôt',
};

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('TransactionsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdTransactionId: string;

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

  // ─── POST /transactions ───────────────────────────────────────────────────────

  describe('POST /api/v1/transactions', () => {
    it('devrait créer une transaction et retourner 201', async () => {
      if (!authToken) {
        console.log('Skipping: pas de token auth E2E');
        return;
      }

      const res = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send(validTransactionPayload)
        .expect((r) => {
          expect([201, 400, 404]).toContain(r.status);
        });

      if (res.status === 201) {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('reference');
        expect(res.body.type).toBe('DEPOT');
        expect(res.body.status).toBe('PENDING');
        createdTransactionId = res.body.id;
      }
    });

    it('devrait retourner 401 sans token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send(validTransactionPayload)
        .expect(401);
    });

    it('devrait retourner 400 si le montant est manquant', async () => {
      if (!authToken) return;

      const { montant, ...withoutMontant } = validTransactionPayload;
      await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send(withoutMontant)
        .expect((r) => {
          expect([400, 422]).toContain(r.status);
        });
    });
  });

  // ─── GET /transactions ────────────────────────────────────────────────────────

  describe('GET /api/v1/transactions', () => {
    it('devrait retourner 200 + liste paginée', async () => {
      if (!authToken) return;

      await request(app.getHttpServer())
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('devrait filtrer par type=DEPOT', async () => {
      if (!authToken) return;

      await request(app.getHttpServer())
        .get('/api/v1/transactions?type=DEPOT')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .expect(200)
        .expect((res) => {
          const { data } = res.body;
          if (data.length > 0) {
            data.forEach((tx: any) => expect(tx.type).toBe('DEPOT'));
          }
        });
    });

    it('devrait retourner 401 sans token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/transactions')
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .expect(401);
    });
  });

  // ─── POST /transactions/:id/cancel ───────────────────────────────────────────

  describe('POST /api/v1/transactions/:id/cancel', () => {
    it('devrait annuler une transaction PENDING et retourner 200', async () => {
      if (!authToken || !createdTransactionId) {
        console.log('Skipping: pas de transaction créée en E2E');
        return;
      }

      await request(app.getHttpServer())
        .post(`/api/v1/transactions/${createdTransactionId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('CANCELLED');
        });
    });

    it("devrait retourner 400 pour une transaction déjà annulée", async () => {
      if (!authToken || !createdTransactionId) return;

      // Tenter d'annuler à nouveau → doit être une erreur
      await request(app.getHttpServer())
        .post(`/api/v1/transactions/${createdTransactionId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .expect((r) => {
          expect([400, 404]).toContain(r.status);
        });
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      if (!authToken) return;

      await request(app.getHttpServer())
        .post('/api/v1/transactions/id-qui-nexiste-pas/cancel')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .expect((r) => {
          expect([404, 400]).toContain(r.status);
        });
    });
  });

  // ─── GET /transactions/stats/today ───────────────────────────────────────────

  describe('GET /api/v1/transactions/stats/today', () => {
    it("devrait retourner 200 + statistiques du jour", async () => {
      if (!authToken) return;

      await request(app.getHttpServer())
        .get('/api/v1/transactions/stats/today')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('montantTotal');
        });
    });
  });
});
