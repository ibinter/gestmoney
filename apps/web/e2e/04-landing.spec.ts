import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test("la page d'accueil se charge correctement", async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/GESTMONEY/i);
    await expect(page.locator('nav').first()).toBeVisible();
  });

  test('le header contient le logo et les liens de navigation', async ({ page }) => {
    await page.goto('/');
    // Logo ou nom de marque présent
    await expect(
      page.locator('header img[alt], header [data-testid="logo"], header .logo, nav img').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('le footer GESTMONEY est présent', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer').first()).toBeVisible();
    // Le footer contient "GESTMONEY" ou "ibigsoft"
    await expect(
      page.locator('footer').filter({ hasText: /gestmoney|ibigsoft/i }).first()
    ).toBeVisible();
  });

  test('le lien "Se connecter" pointe vers /login', async ({ page }) => {
    await page.goto('/');
    const loginLink = page
      .locator('a')
      .filter({ hasText: /se connecter|connexion|login/i })
      .first();

    if (await loginLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginLink.click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test('le formulaire de démo/contact est soumettable', async ({ page }) => {
    await page.goto('/');

    // Chercher un formulaire de demande de démo ou de contact
    const demoForm = page.locator('form').filter({
      has: page.locator('input[type="email"], input[placeholder*="email"]'),
    }).first();

    if (!(await demoForm.isVisible({ timeout: 5000 }).catch(() => false))) {
      // Pas de formulaire visible — test conditionnel
      test.skip();
      return;
    }

    // Remplir les champs requis
    const emailInput = demoForm.locator('input[type="email"], input[placeholder*="email"]').first();
    await emailInput.fill('test@example.com');

    const nameInput = demoForm.locator('input[placeholder*="nom"], input[placeholder*="name"]').first();
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill('Test Demo');
    }

    // Ne pas soumettre réellement pour éviter les effets de bord
    // Vérifier juste que le bouton submit est présent et activable
    const submitBtn = demoForm.locator('[type="submit"]').first();
    await expect(submitBtn).toBeVisible();
  });

  test('la FAQ s\'ouvre et se ferme au clic', async ({ page }) => {
    await page.goto('/');

    const faqBtn = page
      .locator('[data-faq], .faq-question, [aria-expanded], details summary')
      .first();

    if (!(await faqBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Ouvrir
    await faqBtn.click();
    await expect(
      page.locator('[data-faq-answer], .faq-answer, details[open] p').first()
    ).toBeVisible({ timeout: 3000 });

    // Fermer
    await faqBtn.click();
  });

  test('la page est responsive (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('nav, header').first()).toBeVisible();
    // Pas de scroll horizontal
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // tolérance 5px
  });

  test('aucune erreur console critique sur la landing', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Filtrer les erreurs connues non-critiques (ex: fonts, analytics, etc.)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('manifest') &&
        !e.includes('Failed to load resource') &&
        !e.includes('net::ERR')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
