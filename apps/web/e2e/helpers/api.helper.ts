/**
 * Helpers pour les appels directs à l'API NestJS pendant les setup/teardown E2E.
 * L'URL de base est configurée via E2E_API_URL (défaut : http://localhost:3001).
 */

const API_BASE = process.env.E2E_API_URL || 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@gestmoney.ibigsoft.com';
const ADMIN_PASSWORD = 'Gestmoney@2026';

let cachedToken: string | null = null;

/**
 * Récupère (et met en cache) un JWT admin pour les appels API de test.
 */
async function getAdminToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!res.ok) {
    throw new Error(`Échec login API : ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  cachedToken = data.access_token ?? data.token;
  if (!cachedToken) throw new Error('Token absent dans la réponse API');
  return cachedToken;
}

function resetTokenCache(): void {
  cachedToken = null;
}

/**
 * Crée un tenant de test isolé.
 * Retourne l'objet tenant créé (id, name, …).
 */
export async function createTestTenant(name = `test-tenant-${Date.now()}`): Promise<{ id: string; name: string }> {
  const token = await getAdminToken();

  const res = await fetch(`${API_BASE}/tenants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, email: `${name}@test.local`, plan: 'STARTER' }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`createTestTenant a échoué : ${res.status} — ${body}`);
  }

  return res.json();
}

/**
 * Supprime les données créées pour un tenant de test.
 * À appeler dans afterAll/afterEach pour garder la base propre.
 */
export async function cleanupTestData(tenantId: string): Promise<void> {
  const token = await getAdminToken();

  const res = await fetch(`${API_BASE}/tenants/${tenantId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    console.warn(`cleanupTestData : impossible de supprimer le tenant ${tenantId} — ${res.status}`);
  }

  // Réinitialiser le cache token après cleanup pour éviter les tokens expirés
  resetTokenCache();
}

/**
 * Vérifie que l'API est joignable avant de lancer les tests.
 * À utiliser dans globalSetup si besoin.
 */
export async function waitForApi(maxRetries = 10, delayMs = 2000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) return;
    } catch {
      // API pas encore prête
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`L'API ${API_BASE} n'est pas disponible après ${maxRetries} tentatives`);
}
