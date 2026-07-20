// ============================================================
// Service Worker GESTMONEY
// ------------------------------------------------------------
// RÈGLE DE SÉCURITÉ FONDAMENTALE
// Ce service worker ne met JAMAIS en cache une réponse
// authentifiée : ni données de transactions, ni soldes, ni
// informations client, ni page du tableau de bord.
// Les agents Mobile Money travaillent souvent sur un téléphone
// partagé : un cache de données financières y serait lisible
// par l'utilisateur suivant, hors ligne et sans mot de passe.
//
// Ne sont mis en cache que des ressources statiques publiques :
// build Next.js, icônes, images, polices, et la coquille
// publique (accueil, login, page hors-ligne).
// ============================================================

// Incrémenter à chaque déploiement pour invalider l'ancien cache.
const CACHE_VERSION = 'gestmoney-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;

// Coquille publique — aucune de ces pages n'est authentifiée.
const PRECACHE_URLS = ['/', '/login', '/offline.html', '/manifest.json'];

// Chemins dont la réponse ne doit JAMAIS toucher le cache.
// Tout ce qui vit sous /dashboard ou /superadmin est authentifié.
const NEVER_CACHE = [
  '/api/',
  '/dashboard',
  '/superadmin',
  '/auth',
  '/login/callback',
  '/payments',
  '/paiement',
  '/abonnement',
];

// Ressources statiques sûres : immuables et non authentifiées.
const STATIC_PATHS = ['/_next/static/', '/icons/', '/images/', '/fonts/'];
const STATIC_DESTINATIONS = ['style', 'script', 'font', 'image'];

function isNeverCache(url) {
  return NEVER_CACHE.some(
    (p) => url.pathname === p || url.pathname.startsWith(p.endsWith('/') ? p : p + '/') || url.pathname.startsWith(p)
  );
}

function isStaticAsset(url, request) {
  if (STATIC_PATHS.some((p) => url.pathname.startsWith(p))) return true;
  // /_next/image sert des images optimisées, non authentifiées.
  if (url.pathname.startsWith('/_next/image')) return true;
  if (url.pathname === '/favicon.svg' || url.pathname === '/logo.png') return true;
  return STATIC_DESTINATIONS.includes(request.destination) && !isNeverCache(url);
}

// ── Installation : pré-cache de la coquille publique ──────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      // addAll échoue en bloc si une seule URL est absente : on tolère
      // les manquantes pour ne pas empêcher l'installation.
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((u) => cache.add(u).catch(() => undefined))
        )
      )
      .then(() => self.skipWaiting())
  );
});

// ── Activation : purge de tous les caches d'anciennes versions ─
// Purge aussi l'ancien cache « dynamique » de la v1, qui pouvait
// contenir des pages de tableau de bord authentifiées.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n.startsWith('gestmoney-') && n !== STATIC_CACHE)
            .map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Interception réseau ───────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Jamais les requêtes mutantes ni les schémas d'extension.
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Les requêtes portant des identifiants ne sont pas mises en cache.
  // On les laisse filer au réseau sans interception.
  if (url.origin !== self.location.origin) return;

  // ── 1. API : réseau uniquement, jamais de cache ─────────────
  // Une réponse d'API contient des données métier (soldes,
  // transactions, clients) et/ou des jetons : elle ne doit ni
  // être stockée, ni être resservie.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(
            JSON.stringify({
              error: 'offline',
              message: 'Connexion indisponible. Réessayez une fois en ligne.',
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              // On répond en JSON : renvoyer offline.html ici ferait
              // échouer le parsing côté client avec une erreur opaque.
              headers: { 'Content-Type': 'application/json' },
            }
          )
      )
    );
    return;
  }

  // ── 2. Ressources statiques : cache d'abord ─────────────────
  if (isStaticAsset(url, request)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            // Seules les réponses complètes et basiques sont stockables.
            if (response.ok && response.type === 'basic') {
              const cloned = response.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, cloned));
            }
            return response;
          })
      )
    );
    return;
  }

  // ── 3. Navigations : réseau, repli hors-ligne SANS mise en cache ─
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        // Hors ligne : on ne ressert une page depuis le cache que si
        // elle fait partie de la coquille PUBLIQUE pré-cachée.
        // Pour toute route authentifiée, on affiche la page hors-ligne
        // plutôt que d'exposer un écran de données mémorisé.
        if (!isNeverCache(url)) {
          const cached = await caches.match(request, { ignoreSearch: true });
          if (cached) return cached;
        }
        return (
          (await caches.match('/offline.html')) ||
          new Response('Hors ligne', { status: 503 })
        );
      })
    );
    return;
  }

  // ── 4. Tout le reste : réseau strict, aucun cache ───────────
  // (données RSC, fetch applicatifs, etc. — potentiellement
  //  authentifiés, donc jamais stockés.)
});

// ── Messages depuis l'UI ──────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
