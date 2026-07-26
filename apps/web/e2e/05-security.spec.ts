import { test, expect } from '@playwright/test';
import { login } from './helpers/auth.helper';

// Identifiants d'un compte AGENT (à adapter selon le seed de la base de test)
const AGENT_EMAIL = process.env.E2E_AGENT_EMAIL || 'agent@gestmoney.ibigsoft.com';
const AGENT_PASSWORD = process.env.E2E_AGENT_PASSWORD || 'Gestmoney@2026';

test.describe('Sécurité', () => {
  test('un utilisateur non authentifié est redirigé vers /login depuis /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('un AGENT ne peut pas accéder à /superadmin', async ({ page }) => {
    // Tenter de se connecter en tant qu'agent
    // Si les identifiants agent n'existent pas, on teste quand même la redirection pour un non-admin
    await page.goto('/login');
    await page.fill('[name="email"]', AGENT_EMAIL);
    await page.fill('[name="password"]', AGENT_PASSWORD);
    await page.click('[type="submit"]');

    // Quelle que soit la réponse du login, /superadmin ne doit pas être accessible
    await page.goto('/superadmin');
    await expect(page).not.toHaveURL(/superadmin\/dashboard/);
  });

  test("accès direct à /superadmin sans auth redirige ou affiche une 403", async ({ page }) => {
    await page.goto('/superadmin');
    // Soit redirection vers login, soit page 403/404
    const url = page.url();
    const isRedirected = url.includes('login') || url.includes('403') || url.includes('404');
    const has403 = await page.locator('text="403", text="Forbidden", text="Non autorisé"').isVisible().catch(() => false);
    expect(isRedirected || has403).toBeTruthy();
  });

  test('les headers de sécurité sont présents sur la page d\'accueil', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    const headers = response!.headers();

    // Au moins un des headers de sécurité suivants doit être présent
    const securityHeaders = [
      'content-security-policy',
      'x-content-type-options',
      'x-frame-options',
      'strict-transport-security',
      'referrer-policy',
    ];

    const presentHeaders = securityHeaders.filter((h) => !!headers[h]);
    expect(presentHeaders.length).toBeGreaterThan(0);
  });

  test("l'API rejette les requêtes sans token JWT", async ({ page }) => {
    // Appel direct à une route protégée de l'API sans Authorization
    const apiBase = process.env.E2E_API_URL || 'http://localhost:3001';
    const response = await page.request.get(`${apiBase}/transactions`, {
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    });
    // Doit retourner 401 ou 403
    expect([401, 403]).toContain(response.status());
  });

  test('le CSRF / injection SQL basique est rejeté dans le formulaire de login', async ({ page }) => {
    await page.goto('/login');
    // Tentative d'injection SQL dans l'email
    await page.fill('[name="email"]', "admin@test.com' OR '1'='1");
    await page.fill('[name="password"]', "' OR '1'='1");
    await page.click('[type="submit"]');
    // Ne doit pas se connecter
    await expect(page).not.toHaveURL(/dashboard/);
  });

  test("le token est bien effacé après déconnexion", async ({ page }) => {
    await login(page, 'admin@gestmoney.ibigsoft.com', 'Gestmoney@2026');
    await expect(page).toHaveURL(/dashboard/);

    // Déconnexion
    const logoutBtn = page
      .locator('button:has-text("Déconnexion"), button:has-text("Logout"), [data-testid="logout"]')
      .first();

    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForURL(/login/, { timeout: 10000 });
    } else {
      await page.goto('/login');
    }

    // Après déconnexion, accès direct au dashboard doit rediriger vers login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });
});
