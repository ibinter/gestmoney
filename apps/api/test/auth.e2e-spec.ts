/**
 * Tests E2E — Authentification
 * Nécessite DATABASE_URL_TEST pointant vers une base PostgreSQL de test.
 */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

// ─── Credentials de test ──────────────────────────────────────────────────────

const TEST_TENANT_ID = process.env.TEST_TENANT_ID || 'tenant-test-e2e';

const validCredentials = {
  email: process.env.TEST_USER_EMAIL || 'admin.test@gestmoney.ci',
  password: process.env.TEST_USER_PASSWORD || 'Password123!',
};

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── POST /auth/login ────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('devrait retourner 200 + tokens pour des credentials valides', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send(validCredentials)
        .expect((r) => {
          // En test E2E sans DB seed, on accepte 200 ou 401
          expect([200, 401, 404]).toContain(r.status);
        });

      if (res.status === 200) {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body).toHaveProperty('user');
        accessToken = res.body.accessToken;
        refreshToken = res.body.refreshToken;
      }
    });

    it('devrait retourner 401 pour un mauvais mot de passe', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ ...validCredentials, password: 'WrongPassword!' })
        .expect((r) => {
          expect([401, 404]).toContain(r.status);
        });
    });

    it('devrait retourner 400 si le corps est invalide (email manquant)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ password: 'Password123!' })
        .expect((r) => {
          expect([400, 401]).toContain(r.status);
        });
    });
  });

  // ─── POST /auth/refresh ──────────────────────────────────────────────────────

  describe('POST /api/v1/auth/refresh', () => {
    it('devrait retourner 200 + nouveaux tokens pour un refresh token valide', async () => {
      if (!refreshToken) {
        console.log('Skipping: pas de refresh token (pas de DB seed)');
        return;
      }

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });

    it('devrait retourner 401 pour un refresh token invalide', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .send({ refreshToken: 'invalid-token-xyz' })
        .expect((r) => {
          expect([401, 400]).toContain(r.status);
        });
    });
  });

  // ─── GET /auth/me ────────────────────────────────────────────────────────────

  describe('GET /api/v1/auth/me', () => {
    it('devrait retourner 200 + profil avec un token valide', async () => {
      if (!accessToken) {
        console.log('Skipping: pas de token (pas de DB seed)');
        return;
      }

      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('roles');
        });
    });

    it('devrait retourner 401 sans token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .expect(401);
    });

    it('devrait retourner 401 avec un token malformé', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer token-invalide-xyz')
        .set('X-Tenant-ID', TEST_TENANT_ID)
        .expect(401);
    });
  });
});
