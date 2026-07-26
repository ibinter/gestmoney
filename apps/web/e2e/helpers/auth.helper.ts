import { Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@gestmoney.ibigsoft.com';
const ADMIN_PASSWORD = 'Gestmoney@2026';

/**
 * Remplit le formulaire de login et attend la redirection vers le dashboard.
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('[type="submit"]');
  // Attendre la redirection (dashboard ou erreur)
  await page.waitForURL(/(dashboard|login)/, { timeout: 15000 });
}

/**
 * Se connecte avec le compte administrateur par défaut.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
}

/**
 * Déconnecte l'utilisateur courant via le menu profil ou le bouton logout.
 */
export async function logout(page: Page): Promise<void> {
  // Tenter de cliquer sur le bouton de déconnexion (plusieurs sélecteurs possibles)
  const logoutSelectors = [
    'button:has-text("Déconnexion")',
    'button:has-text("Logout")',
    '[data-testid="logout"]',
    'a[href="/login"]',
  ];

  for (const selector of logoutSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      await el.click();
      await page.waitForURL(/login/, { timeout: 10000 });
      return;
    }
  }

  // Fallback : naviguer directement vers /login
  await page.goto('/login');
}
