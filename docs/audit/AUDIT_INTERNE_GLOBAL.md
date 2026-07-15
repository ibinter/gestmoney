# AUDIT INTERNE GLOBAL — GESTMONEY
> Date d'audit : 2026-07-15  
> Auditeur : Claude Code (analyse statique du code source)  
> Périmètre : Espace authentifié (dashboard + superadmin), API NestJS, Schéma Prisma

---

## 1. ARCHITECTURE DÉTECTÉE

### Stack technique confirmée
| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | Next.js App Router | 14 |
| Backend | NestJS | 10 |
| ORM | Prisma | PostgreSQL |
| Auth | JWT httpOnly cookie (`gestmoney_token`) | — |
| State | Zustand (`authStore`, `dashboardStore`) | — |
| Data fetching | TanStack Query (React Query) | — |
| UI | Composants custom + Tailwind CSS | — |
| i18n | Système maison (`useT()`) | FR/EN |
| WebSocket | Gateway NestJS (`GatewayModule`) | — |

### Structure des répertoires principaux
```
apps/
  web/src/app/
    (dashboard)/
      dashboard/        → 17 pages/redirects (espace tenant)
      superadmin/       → 9 pages (espace IBIG Soft)
    (public)/           → landing, login, register, ...
  api/src/
    [22 modules NestJS]
packages/
  database/schema.prisma → 40+ modèles Prisma
```

### Modules NestJS actifs (app.module.ts)
`accounting` · `agencies` · `agents` · `ai` · `audit` · `auth` · `cashier` · `commissions` · `config-app` · `customers` · `float` · `gateway` · `hr` · `integrations` · `kyc` · `notifications` · `prisma` · `reporting` · `roles` · `stock` · `tenants` · `transactions` · `users`

**Modules Prisma sans module NestJS correspondant :** `reversal` (annulations), `superAgent`, `territory`, `mlPredictions`, `exchangeRate`, `pageLeGale`, `analyticsEvent`, `emailTemplate`, `emailLog`, `ticket`, `paiement`, `licenceEvent`, `saraConversation`, `prospect`, `demonstration`, `offre`

---

## 2. ÉTAT PAR MODULE — ESPACE DASHBOARD (tenant)

| Module | Page | Composants | Hooks | API connectée | État général |
|--------|------|-----------|-------|---------------|-------------|
| Dashboard principal | `/dashboard` | DashboardCard, SkeletonCard | `useDashboardStore` | Partiel (store Zustand) | PARTIEL |
| Transactions | `/dashboard/transactions` | Table, Modal, Badge, StatCard | `useTransactions`, `useCreateTransaction`, `useValiderTransaction` | Oui via `/api/transactions` | COMPLET |
| Agents | `/dashboard/agents` | Table, Modal, StatCard | `useAgents`, `useCreateAgent`, `useToggleAgentStatus` | Oui via `/api/agents` | COMPLET |
| Agences | `/dashboard/agences` | Table, Modal, StatCard | `useAgences`, `useCreateAgence`, `useToggleAgenceStatus` | Oui via `/api/agencies` | COMPLET |
| Float | `/dashboard/float` | Sparkline SVG, Table, Modal | `useFloatSoldes`, `useFloatMouvements`, `useDemandesReappro`, `useCreerDemandeReappro` | Oui via `/api/float` | COMPLET |
| Caisse | `/dashboard/caisse` | Table, Modal, StatCard | `useEcritures`, `useCaisseStats`, `useAddEcriture` | Oui via `/api/cashier` | COMPLET |
| Commissions | `/dashboard/commissions` | Table, StatCard | `useCommissions`, `useValiderCommissions`, `usePayerCommissions` | Oui via `/api/commissions` | COMPLET |
| Clients | `/dashboard/clients` | Table, Modal, StatCard | `useClients`, `useCreateClient` | Oui via `/api/customers` | COMPLET |
| Rapports | `/dashboard/rapports` | Card, Select, Badge | `useRapports`, `useGenererRapport` | Oui (périodes hardcodées) | PARTIEL |
| Performances | `/dashboard/performances` | StatCard, Select | `usePerformances` | Oui via hook | PARTIEL |
| Support / Tickets | `/dashboard/support` | Composants inline (Ticket, Message) | Direct `api` (sans hook dédié) | Partiel (types locaux) | PARTIEL |
| Paramètres | `/dashboard/settings` | Tabs, Toggle, Input | `useAuthStore`, `useOnboarding` | Non connecté (formulaires sans mutation) | PARTIEL |
| Aide / Guide | `/dashboard/aide` | Accordion inline | Aucun (données statiques) | Non (contenu hardcodé) | PARTIEL |
| Notifications | `/dashboard/notifications` | Liste inline | `useNotifications`, `useMarkAsRead`, `useMarkAllAsRead`, `useDeleteNotification` | Oui via hook | COMPLET |
| Profil | `/dashboard/profile` | — | — | — | À ANALYSER |
| customers (alias) | `/dashboard/customers` | Redirect | — | — | REDIRECT → /clients |
| reporting (alias) | `/dashboard/reporting` | Redirect | — | — | REDIRECT → /rapports |

---

## 3. ÉTAT PAR MODULE — ESPACE SUPERADMIN (IBIG Soft)

| Module | Page | Données réelles | État |
|--------|------|-----------------|------|
| Tableau de bord SA | `/superadmin` | MOCK (`MOCK_STATS`, `MOCK_TENANTS`) | CRITIQUE — données fictives |
| Analytics | `/superadmin/analytics` | À vérifier | À ANALYSER |
| Prospects CRM | `/superadmin/prospects` | À vérifier | À ANALYSER |
| Démonstrations | `/superadmin/demonstrations` | À vérifier | À ANALYSER |
| Offres | `/superadmin/offres` | À vérifier | À ANALYSER |
| Licences | `/superadmin/licences` | À vérifier | À ANALYSER |
| Paiements | `/superadmin/paiements` | À vérifier | À ANALYSER |
| Emails | `/superadmin/emails` | À vérifier | À ANALYSER |
| SARA IA | `/superadmin/sara` | À vérifier | À ANALYSER |

---

## 4. BUGS ET ANOMALIES DÉTECTÉS

### CRITIQUE

| # | Page / Fichier | Route | Bug | Cause | Correction suggérée |
|---|----------------|-------|-----|-------|---------------------|
| C1 | `middleware.ts` | Toutes les routes protégées | Signature JWT non vérifiée côté Edge | `atob(parts[1])` sans vérification de la signature cryptographique — un JWT forgé passe le middleware | Ne pas vérifier côté Edge ou utiliser `jose` (compatible Edge). Laisser la vérification au backend NestJS uniquement. |
| C2 | `superadmin/page.tsx` | `/superadmin` | Données 100% fictives affichées comme réelles | Variables `MOCK_STATS` et `MOCK_TENANTS` hardcodées dans le composant | Connecter aux endpoints API `/api/tenants`, `/api/reporting` |
| C3 | `middleware.ts` | `/superadmin/*` | Protection par rôle uniquement sur `/superadmin` — aucune protection des sous-routes dashboard par rôle | `isSuperAdminRoute()` ne couvre que le préfixe superadmin, les routes `/dashboard/*` ne sont pas protégées par rôle | Ajouter une vérification de rôle par section dans le middleware ou côté composant |
| C4 | `(dashboard)/layout.tsx` | Tout le dashboard | Race condition auth — useEffect déclenché après le premier rendu | `useEffect` redirige vers `/login` si non auth, mais la page s'affiche brièvement avant | Ajouter `if (!isAuthenticated) return null` avant le return JSX |

### MAJEUR

| # | Page / Fichier | Route | Bug | Cause | Correction suggérée |
|---|----------------|-------|-----|-------|---------------------|
| M1 | `rapports/page.tsx` | `/dashboard/rapports` | Périodes de rapport hardcodées (`janvier_2024`, `decembre_2023`, `trimestre_4_2023`) | Array `PERIODES` statique | Générer dynamiquement les 12 derniers mois depuis `new Date()` |
| M2 | `settings/page.tsx` | `/dashboard/settings` | Onglet Profil non connecté à l'API | Formulaire sans mutation — les modifications ne sont pas sauvegardées | Ajouter `useMutation` vers `PATCH /api/users/:id` |
| M3 | `aide/page.tsx` | `/dashboard/aide` | Contenu du guide entièrement hardcodé | Articles et FAQ en données statiques dans le composant | Charger depuis l'API ou CMS |
| M4 | `transactions/page.tsx` | `/dashboard/transactions` | Bouton "Actualiser" sans handler | `<Button icone={<RefreshCw/>}>Actualiser</Button>` sans `onClick` | Ajouter `onClick={() => refetch()` |
| M5 | `agents/page.tsx` | `/dashboard/agents` | Bouton "Voir" sans navigation | `<button className="...">Voir</button>` sans onClick | Ajouter navigation vers page détail agent |
| M6 | Rôles API vs middleware | Auth | Désalignement des rôles — middleware attend `SUPER_ADMIN` (chaîne), API enum a `SUPER_ADMIN`, mais les rôles Prisma sont dynamiques (table `roles`) | Enum `RoleType` dans l'API n'inclut pas `ADMIN`, `MANAGER`, `CAISSIER` mentionnés dans le CDC | Harmoniser les rôles système entre `role.enum.ts`, le schéma Prisma et le middleware |
| M7 | `support/page.tsx` | `/dashboard/support` | Pas de hook dédié — appels API directs avec `api` non typés | Absence de `useTickets` hook | Créer `hooks/useTickets.ts` avec TanStack Query |
| M8 | `customers/page.tsx` | `/dashboard/customers` | Route doublon non nettoyée | Simple redirect vers `/dashboard/clients` | Supprimer la route ou documenter comme alias officiel |
| M9 | `reporting/page.tsx` | `/dashboard/reporting` | Route doublon non nettoyée | Simple redirect vers `/dashboard/rapports` | Idem |

### MINEUR

| # | Page / Fichier | Bug | Correction |
|---|----------------|-----|------------|
| mn1 | `agents/page.tsx` | Typo "telephone" (sans accent) dans l'en-tête de colonne | Corriger en "Téléphone" |
| mn2 | `agents/page.tsx` | Typo "Inscription" dans la colonne `createdAt` — devrait être "Date d'inscription" | Cosmétique |
| mn3 | `commissions/page.tsx` | Labels "calculee", "validee", "payee" sans accents | Corriger : "Calculée", "Validée", "Payée" |
| mn4 | Plusieurs pages | `eslint-disable-line react-hooks/exhaustive-deps` sur `useEffect` vide | Corriger les dépendances manquantes |
| mn5 | `dashboard/page.tsx` | Action "Exporter" sur la card Rapports a un `onClick={() => {}}` vide | Connecter à `exporterPdf` ou `exporterXlsx` |
| mn6 | `superadmin/layout.tsx` | À vérifier si la protection double est en place | — |

---

## 5. MODULES API SANS PAGE FRONTEND

Les modules NestJS suivants n'ont pas de page dashboard correspondante :

| Module API | Modèles Prisma couverts | Status frontend |
|-----------|------------------------|-----------------|
| `accounting` | AccountChart, JournalEntry, Ledger, FiscalYear | MANQUANT |
| `hr` | Employee, Contract, Payroll, Leave | MANQUANT |
| `stock` | Product, Inventory, StockMovement | MANQUANT |
| `audit` | AuditLog | MANQUANT (logs audit) |
| `kyc` | KycVerification | MANQUANT |
| `integrations` | IntegrationLog | MANQUANT |
| `roles` | Role, Permission, RolePermission | MANQUANT |
| `tenants` | Tenant | MANQUANT (dans SA) |

---

## 6. POINTS POSITIFS DÉTECTÉS

- Architecture multi-tenant bien structurée avec isolation par `tenantId`
- JWT httpOnly cookie correctement configuré (pas de localStorage)
- Skeleton loaders présents sur le dashboard principal
- Export CSV fonctionnel sur Transactions, Agents, Agences, Commissions
- Export PDF/XLSX présent sur Rapports
- Pagination côté serveur sur Transactions (paramètres `page` et `limit`)
- Pagination côté client sur Agents (filtrage local)
- Composants UI bien factorisés (Table, Modal, Badge, StatCard, Button)
- i18n FR/EN en place via `useT()`
- WebSocket Gateway présent pour les notifications temps réel
- Circuit-breaker et retry sur les intégrations opérateurs Mobile Money

---

## 7. COUVERTURE DE TESTS

| Module | Tests existants |
|--------|----------------|
| `transactions.service.spec.ts` | Présent |
| `commissions.service.spec.ts` | Présent |
| `accounting.service.spec.ts` | Présent |
| `auth.service.spec.ts` | Présent |
| Frontend (Jest/Vitest) | Non détecté |
| E2E (Playwright/Cypress) | Non détecté |

**Couverture estimée : FAIBLE** — 4 fichiers spec backend, aucun test frontend détecté.
