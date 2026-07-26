import { test, expect } from '@playwright/test';
import { login, loginAsAdmin } from './helpers/auth.helper';

test.describe('Authentification', () => {
  test('login avec identifiants valides redirige vers le dashboard', async ({ page }) => {
    await login(page, 'admin@gestmoney.ibigsoft.com', 'Gestmoney@2026');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('login avec mauvais mot de passe affiche une erreur', async ({ page }) => {
    await login(page, 'admin@gestmoney.ibigsoft.com', 'mauvaismdp');
    // L'URL ne doit pas contenir "dashboard"
    await expect(page).not.toHaveURL(/dashboard/);
    // Un message d'erreur doit être visible
    await expect(
      page.locator('[role="alert"], .error, [data-error], .toast-error, [data-sonner-toast]').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('login avec email inexistant affiche une erreur', async ({ page }) => {
    await login(page, 'inexistant@gestmoney.ibigsoft.com', 'Password@123');
    await expect(page).not.toHaveURL(/dashboard/);
  });

  test('accès au dashboard sans auth redirige vers login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('accès aux sous-pages dashboard sans auth redirige vers login', async ({ page }) => {
    for (const path of ['/dashboard/transactions', '/dashboard/agences', '/dashboard/clients']) {
      await page.goto(path);
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    }
  });

  test('après login, F5 maintient la session (cookie persistant)', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/dashboard/);
    await page.reload();
    await expect(page).toHaveURL(/dashboard/);
  });

  test('le formulaire login valide les champs vides', async ({ page }) => {
    await page.goto('/login');
    // Soumettre sans remplir les champs
    await page.click('[type="submit"]');
    // Doit rester sur la page login
    await expect(page).toHaveURL(/login/);
  });
});
