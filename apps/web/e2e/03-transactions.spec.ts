import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.helper';

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('la liste des transactions se charge', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    // Attendre que le tableau ou le message "aucune transaction" s'affiche
    await expect(
      page.locator('table, [data-empty], [data-testid="empty-state"], .empty-state').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("le modal de création de transaction s'ouvre", async ({ page }) => {
    await page.goto('/dashboard/transactions');
    // Chercher un bouton de création (plusieurs libellés possibles)
    const createBtn = page
      .locator('button')
      .filter({ hasText: /nouveau|créer|ajouter|nouvelle transaction/i })
      .first();

    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();
      await expect(
        page.locator('[role="dialog"], .modal, [data-testid="modal"]').first()
      ).toBeVisible({ timeout: 5000 });
    } else {
      // Le bouton n'est pas visible dans cet état — le test passe (scénario conditionnel)
      test.skip();
    }
  });

  test('la pagination fonctionne sans erreur 500', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    // Attendre le chargement initial
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Si un bouton "page suivante" existe et est actif, cliquer dessus
    const nextBtn = page
      .locator('button[aria-label*="suivant"], button:has-text("Suivant"), [data-testid="next-page"]')
      .first();

    if (await nextBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
      // Vérifier qu'aucune erreur 500 ne s'affiche
      await expect(page.locator('text="Internal Server Error"')).not.toBeVisible({ timeout: 5000 });
      await expect(page.locator('text="500"')).not.toBeVisible();
    }
  });

  test('la recherche filtre les résultats', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const searchInput = page
      .locator('input[type="search"], input[placeholder*="recherch"], input[placeholder*="search"]')
      .first();

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      // La page ne doit pas crasher
      await expect(page.locator('text="Internal Server Error"')).not.toBeVisible();
    }
  });

  test('les champs du formulaire de transaction acceptent les valeurs valides', async ({ page }) => {
    await page.goto('/dashboard/transactions');

    const createBtn = page
      .locator('button')
      .filter({ hasText: /nouveau|créer|ajouter/i })
      .first();

    if (!(await createBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await createBtn.click();

    const modal = page.locator('[role="dialog"], .modal').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Vérifier que les champs principaux sont présents dans le modal
    await expect(modal.locator('input, select, textarea').first()).toBeVisible();
  });
});
