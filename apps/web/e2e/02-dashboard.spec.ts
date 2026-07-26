import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/dashboard/);
  });

  test("les KPI cards s'affichent sans erreur 500", async ({ page }) => {
    await page.goto('/dashboard');
    // Le titre principal doit être visible
    await expect(
      page.locator('h1, [data-testid="dashboard-title"], [data-testid="kpi"]').first()
    ).toBeVisible({ timeout: 15000 });
    // Aucune erreur 500 visible à l'écran
    await expect(page.locator('[data-error="500"], .error-500, text="500"')).not.toBeVisible();
    // Pas de message d'erreur générique non plus
    await expect(page.locator('text="Internal Server Error"')).not.toBeVisible();
  });

  test('la page transactions se charge', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    await expect(page).toHaveURL(/transactions/);
    await expect(
      page.locator('table, [data-empty], [data-testid="transactions-list"], h1').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('la page agences se charge', async ({ page }) => {
    await page.goto('/dashboard/agences');
    await expect(page).toHaveURL(/agences/);
    await expect(
      page.locator('table, [data-empty], [data-testid="agences-list"], h1').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('la page clients se charge', async ({ page }) => {
    await page.goto('/dashboard/clients');
    await expect(page).toHaveURL(/clients/);
    await expect(
      page.locator('table, [data-empty], [data-testid="clients-list"], h1').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('la page opérateurs se charge', async ({ page }) => {
    await page.goto('/dashboard/operateurs');
    await expect(page).toHaveURL(/operateurs/);
    await expect(
      page.locator('table, [data-empty], [data-testid="operateurs-list"], h1').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('la barre de navigation latérale est présente', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('nav, aside, [data-testid="sidebar"]').first()).toBeVisible();
  });

  test("la page profil s'affiche", async ({ page }) => {
    await page.goto('/dashboard/profile');
    await expect(page).toHaveURL(/profile/);
    await expect(
      page.locator('h1, [data-testid="profile"], form').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("la page support s'affiche", async ({ page }) => {
    await page.goto('/dashboard/support');
    await expect(page).toHaveURL(/support/);
    await expect(
      page.locator('h1, [data-testid="support"], form, textarea').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("la page abonnement s'affiche", async ({ page }) => {
    await page.goto('/dashboard/abonnement');
    await expect(page).toHaveURL(/abonnement/);
    await expect(
      page.locator('h1, [data-testid="abonnement"]').first()
    ).toBeVisible({ timeout: 10000 });
  });
});
