'use client';
import React, { useState } from 'react';
import {
  Code2,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Lock,
  Globe,
  Zap,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

// ─── Utilitaire copie ────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      className="absolute top-2 right-2 p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
      title="Copier"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-white/60" />}
    </button>
  );
}

// ─── Bloc de code ─────────────────────────────────────────────────────────────
function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <div className="relative mt-2 rounded-lg bg-gray-900 text-sm font-mono text-gray-200 overflow-x-auto">
      <span className="absolute top-2 left-3 text-[10px] uppercase tracking-wider text-gray-500">
        {lang}
      </span>
      <CopyButton text={code} />
      <pre className="pt-7 pb-4 px-4 whitespace-pre-wrap break-words leading-relaxed">{code}</pre>
    </div>
  );
}

// ─── Section repliable ────────────────────────────────────────────────────────
function Section({ title, icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors text-left"
      >
        <span className="text-blue-600 dark:text-blue-400">{icon}</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100 flex-1">{title}</span>
        {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-5 py-4 bg-white dark:bg-gray-900 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Endpoint pill ────────────────────────────────────────────────────────────
function Method({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    POST: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    PATCH: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };
  return (
    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded font-mono ${colors[method] ?? ''}`}>
      {method}
    </span>
  );
}

function EndpointRow({ method, path, desc }: { method: string; path: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <Method method={method} />
      <code className="text-xs text-purple-700 dark:text-purple-300 font-mono whitespace-nowrap">{path}</code>
      <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">{desc}</span>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ApiDocsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Restriction de rôle côté client (la vraie sécurité est serveur)
  const allowedRoles = ['SUPER_ADMIN', 'NETWORK_ADMIN'];
  const hasAccess = user?.roles?.some((r: string) => allowedRoles.includes(r));
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <Lock size={48} className="text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Accès réservé</h2>
        <p className="text-gray-500 max-w-md">
          La documentation API est réservée aux administrateurs réseau et super-admins.
        </p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Retour
        </button>
      </div>
    );
  }

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  const SWAGGER_URL = API_BASE.replace('/api/v1', '/api/docs');

  const loginCurl = `curl -X POST ${API_BASE}/auth/login \\
  -H "Content-Type: application/json" \\
  -H "X-Tenant-ID: <votre-tenant-id>" \\
  -d '{"email":"admin@exemple.com","password":"VotreMotDePasse@123"}'`;

  const txCurl = `# 1. Récupérer un token
TOKEN=$(curl -s -X POST ${API_BASE}/auth/login \\
  -H "Content-Type: application/json" \\
  -H "X-Tenant-ID: <tenant-id>" \\
  -d '{"email":"admin@exemple.com","password":"..."}' | jq -r '.accessToken // empty')

# 2. Créer une transaction
curl -X POST ${API_BASE}/transactions \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "DEPOT",
    "montant": 50000,
    "operateur": "ORANGE",
    "clientPhone": "+2250102030405"
  }'`;

  const agentsCurl = `curl -X GET "${API_BASE}/agents?page=1&limit=20" \\
  -H "Authorization: Bearer $TOKEN"`;

  const floatCurl = `curl -X GET ${API_BASE}/float/alerts \\
  -H "Authorization: Bearer $TOKEN"`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={28} />
          <h1 className="text-2xl font-bold">Documentation API GESTMONEY</h1>
        </div>
        <p className="text-blue-100 text-sm max-w-2xl">
          API REST NestJS — version 1.0.0. Toutes les routes authentifiées requièrent un Bearer JWT.
          La documentation interactive Swagger est disponible sur le serveur API.
        </p>
        <a
          href={SWAGGER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white text-blue-700 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors"
        >
          <ExternalLink size={15} />
          Ouvrir Swagger UI
        </a>
      </div>

      {/* Infos rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: <Globe size={18} />, label: 'Base URL', value: API_BASE },
          { icon: <Lock size={18} />, label: 'Auth', value: 'Bearer JWT (cookie httpOnly)' },
          { icon: <Zap size={18} />, label: 'Rate limit login', value: '5 req / min / IP' },
        ].map((item) => (
          <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <span className="text-blue-500 mt-0.5">{item.icon}</span>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
              <div className="text-xs font-mono text-gray-800 dark:text-gray-200 break-all">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Section Authentification */}
      <Section title="Authentification" icon={<Lock size={18} />} defaultOpen>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Appelez <code className="text-purple-600">POST /auth/login</code> pour obtenir un token.
          Le token est retourné dans le body <strong>et</strong> stocké en cookie httpOnly{' '}
          <code>gestmoney_token</code> (durée 7 jours). Passez-le dans le header{' '}
          <code>Authorization: Bearer &lt;token&gt;</code> pour les appels suivants.
        </p>
        <CodeBlock code={loginCurl} lang="bash" />
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-sm">
          <strong>Header X-Tenant-ID</strong> — obligatoire si le tenant n'est pas déduit du domaine.
          Doit correspondre au <code>tenantId</code> encodé dans le JWT.
        </div>
      </Section>

      {/* Section Endpoints courants */}
      <Section title="Endpoints courants" icon={<Code2 size={18} />} defaultOpen>
        <div className="space-y-1">
          <EndpointRow method="POST" path="/auth/login" desc="Connexion — retourne accessToken + refreshToken" />
          <EndpointRow method="POST" path="/auth/register" desc="Inscription d'un utilisateur (hors tenant root)" />
          <EndpointRow method="GET"  path="/auth/me" desc="Profil de l'utilisateur connecté" />
          <EndpointRow method="POST" path="/auth/logout" desc="Déconnexion (révoque le token)" />
          <EndpointRow method="POST" path="/transactions" desc="Créer une transaction Mobile Money" />
          <EndpointRow method="GET"  path="/transactions" desc="Liste paginée avec filtres avancés" />
          <EndpointRow method="POST" path="/transactions/:id/complete" desc="Valider une transaction en attente" />
          <EndpointRow method="POST" path="/transactions/:id/cancel" desc="Annuler une transaction" />
          <EndpointRow method="GET"  path="/agents" desc="Lister les agents (filtres, pagination)" />
          <EndpointRow method="POST" path="/agents" desc="Créer un agent" />
          <EndpointRow method="POST" path="/agents/:id/suspend" desc="Suspendre un agent" />
          <EndpointRow method="GET"  path="/float" desc="Comptes float par opérateur / agence" />
          <EndpointRow method="GET"  path="/float/alerts" desc="Alertes float sous seuil" />
          <EndpointRow method="POST" path="/float/replenish" desc="Demande de réapprovisionnement" />
          <EndpointRow method="GET"  path="/accounting/balance-sheet" desc="Bilan SYSCOHADA" />
          <EndpointRow method="GET"  path="/accounting/income-statement" desc="Compte de résultat" />
          <EndpointRow method="GET"  path="/analytics/dashboard" desc="KPIs 30 derniers jours" />
          <EndpointRow method="POST" path="/import/:type" desc="Import XLSX/CSV (agents, transactions…)" />
          <EndpointRow method="GET"  path="/licences/mon-statut" desc="Statut de la licence courante" />
        </div>
      </Section>

      {/* Exemples curl */}
      <Section title="Exemples de requêtes" icon={<Zap size={18} />}>
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Créer une transaction</h3>
        <CodeBlock code={txCurl} lang="bash" />

        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mt-4">Lister les agents</h3>
        <CodeBlock code={agentsCurl} lang="bash" />

        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mt-4">Alertes float</h3>
        <CodeBlock code={floatCurl} lang="bash" />
      </Section>

      {/* Authentification par clé API */}
      <Section title="Authentification par clé API" icon={<Lock size={18} />}>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          En plus du JWT, GESTMONEY accepte des <strong>clés API</strong> pour les intégrations
          partenaires (ERP, TPE, apps maison…). Une clé se génère dans{' '}
          <a href="/dashboard/api-keys" className="text-blue-600 dark:text-blue-400 underline">
            Clés API
          </a>
          . Passez-la dans le header <code>Authorization</code> :
        </p>
        <CodeBlock
          code={`curl -H "Authorization: Bearer gm_live_votreclé" \\
     -H "X-Tenant-ID: <votre-tenant-id>" \\
     https://gestmoney.ibigsoft.com/api/v1/transactions`}
          lang="bash"
        />
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300 space-y-1">
          <p><strong>Format de la clé :</strong> <code>gm_live_</code> suivi de 32 caractères hexadécimaux.</p>
          <p><strong>Permissions :</strong> chaque clé est limitée à un sous-ensemble de droits (<code>transactions:read</code>, <code>transactions:write</code>, etc.).</p>
          <p><strong>IP whitelist :</strong> optionnelle — limitez les appels à des IPs connues pour plus de sécurité.</p>
          <p><strong>Durée de vie :</strong> définissable à la création. Si absente, la clé n'expire pas mais peut être révoquée à tout moment.</p>
        </div>
        <div className="space-y-1">
          <EndpointRow method="POST"   path="/api-keys"     desc="Générer une clé (retournée UNE SEULE FOIS)" />
          <EndpointRow method="GET"    path="/api-keys"     desc="Lister les clés (sans valeurs en clair)" />
          <EndpointRow method="DELETE" path="/api-keys/:id" desc="Révoquer une clé immédiatement" />
        </div>
      </Section>

      {/* Codes d'erreur */}
      <Section title="Codes HTTP et erreurs" icon={<BookOpen size={18} />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 pr-4 font-semibold text-gray-600 dark:text-gray-400">Code</th>
                <th className="pb-2 pr-4 font-semibold text-gray-600 dark:text-gray-400">Signification</th>
                <th className="pb-2 font-semibold text-gray-600 dark:text-gray-400">Cause fréquente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {[
                ['200 / 201', 'Succès', 'Réponse normale'],
                ['400', 'Bad Request', 'Validation DTO échouée, données manquantes'],
                ['401', 'Unauthorized', 'Token absent, expiré ou invalide'],
                ['403', 'Forbidden', 'Rôle insuffisant (ex. AGENT sur route ADMIN)'],
                ['404', 'Not Found', 'Ressource inexistante pour ce tenant'],
                ['409', 'Conflict', 'Email déjà utilisé, doublon'],
                ['429', 'Too Many Requests', 'Rate-limit atteint'],
                ['500', 'Internal Error', 'Erreur serveur — contacter le support'],
              ].map(([code, name, cause]) => (
                <tr key={code} className="text-gray-700 dark:text-gray-300">
                  <td className="py-1.5 pr-4 font-mono text-xs font-semibold">{code}</td>
                  <td className="py-1.5 pr-4 font-medium">{name}</td>
                  <td className="py-1.5 text-gray-500 dark:text-gray-400 text-xs">{cause}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Swagger iframe hint */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
        <ExternalLink size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          La documentation interactive complète (Swagger UI) est disponible à{' '}
          <a
            href={SWAGGER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold hover:text-blue-600"
          >
            {SWAGGER_URL}
          </a>
          {' '}(serveur API uniquement, hors production).
        </div>
      </div>
    </div>
  );
}
