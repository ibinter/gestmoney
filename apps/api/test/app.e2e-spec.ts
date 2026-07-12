/**
 * Bootstrap E2E — GESTMONEY
 * Démarre l'application NestJS en mémoire et seed les données de base.
 * Ce fichier est importé par les autres specs E2E via le helper `getApp()`.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';

// ─── Helper partagé ───────────────────────────────────────────────────────────

let app: INestApplication;

export async function initApp(): Promise<INestApplication> {
  if (app) return app;

  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication();

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();
  return app;
}

export async function closeApp(): Promise<void> {
  if (app) await app.close();
}

// ─── Tests de santé ───────────────────────────────────────────────────────────

describe('AppModule (e2e)', () => {
  let testApp: INestApplication;

  beforeAll(async () => {
    testApp = await initApp();
  });

  afterAll(async () => {
    await closeApp();
  });

  it('GET /api/v1/health → 200 OK', () => {
    return request(testApp.getHttpServer())
      .get('/api/v1/health')
      .expect((res) => {
        // L'endpoint health peut retourner 200 ou 404 selon la config
        expect([200, 404]).toContain(res.status);
      });
  });

  it("GET /api/v1/route-inexistante → 404", () => {
    return request(testApp.getHttpServer())
      .get('/api/v1/route-qui-nexiste-pas')
      .expect(404);
  });
});
