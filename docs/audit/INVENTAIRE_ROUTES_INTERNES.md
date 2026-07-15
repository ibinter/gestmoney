# INVENTAIRE DES ROUTES INTERNES — GESTMONEY
> Date : 2026-07-15 | Source : `apps/web/src/app/(dashboard)/`

---

## LÉGENDE

| Statut | Description |
|--------|-------------|
| ✅ OK | Page implémentée, composants présents, hooks connectés à l'API |
| ⚠️ PARTIEL | Page présente mais fonctionnalités incomplètes (formulaires non sauvegardés, données mock, etc.) |
| 🔀 REDIRECT | Fichier page existant mais ne fait que rediriger vers une autre route |
| ❌ MANQUANT | Route référencée dans le code ou la CDC mais aucune page existante |
| 🔒 SA ONLY | Accessible uniquement au rôle SUPER_ADMIN |

---

## ESPACE DASHBOARD TENANT (`/dashboard/*`)

| Route | Fichier page | Statut | Description | Anomalies |
|-------|-------------|--------|-------------|-----------|
| `/dashboard` | `dashboard/page.tsx` | ⚠️ PARTIEL | Dashboard principal — 8 cartes KPI, bannière IA, barre progression | Stats via `dashboardStore` non directement liées à l'API en temps réel ; action "Exporter" vide sur card Rapports |
| `/dashboard/transactions` | `dashboard/transactions/page.tsx` | ✅ OK | Liste paginée, création (dépôt/retrait/cash_in/cash_out), validation, export CSV, modal détail | Bouton "Actualiser" sans `onClick` |
| `/dashboard/agents` | `dashboard/agents/page.tsx` | ✅ OK | Liste agents, création, activation/suspension, export CSV | Bouton "Voir" sans navigation ; typo "telephone" |
| `/dashboard/agences` | `dashboard/agences/page.tsx` | ✅ OK | Liste agences, création, activation/suspension, export CSV | — |
| `/dashboard/float` | `dashboard/float/page.tsx` | ✅ OK | Soldes par opérateur, sparkline, mouvements, demandes de réapprovisionnement | — |
| `/dashboard/caisse` | `dashboard/caisse/page.tsx` | ✅ OK | Journal de caisse, stats, ajout écriture, export | — |
| `/dashboard/commissions` | `dashboard/commissions/page.tsx` | ✅ OK | Liste commissions, validation, paiement en lot, export CSV | Labels sans accents (mineur) |
| `/dashboard/clients` | `dashboard/clients/page.tsx` | ✅ OK | Liste clients, création, filtre KYC/statut, export CSV | — |
| `/dashboard/rapports` | `dashboard/rapports/page.tsx` | ⚠️ PARTIEL | Historique rapports, génération, export PDF/XLSX/CSV | Périodes hardcodées 2023/2024 — non dynamiques |
| `/dashboard/performances` | `dashboard/performances/page.tsx` | ⚠️ PARTIEL | Stats volume/transactions, top agents, répartition opérateurs, objectifs | Données dépendent de `usePerformances` — à vérifier si endpoint existe |
| `/dashboard/support` | `dashboard/support/page.tsx` | ⚠️ PARTIEL | Liste tickets, création ticket, thread messages | Pas de hook dédié (appels `api` directs) ; types définis localement |
| `/dashboard/settings` | `dashboard/settings/page.tsx` | ⚠️ PARTIEL | Onglets Profil / Sécurité / Notifications / Apparence | Formulaire Profil non connecté à l'API (pas de mutation) |
| `/dashboard/aide` | `dashboard/aide/page.tsx` | ⚠️ PARTIEL | Guide utilisateur, FAQ accordéon, export PDF | Contenu entièrement hardcodé dans le composant |
| `/dashboard/notifications` | `dashboard/notifications/page.tsx` | ✅ OK | Liste notifications, marquer lu/non lu, supprimer, filtres | — |
| `/dashboard/profile` | `dashboard/profile/page.tsx` | ⚠️ PARTIEL | Page profil utilisateur | Contenu à analyser en détail |
| `/dashboard/customers` | `dashboard/customers/page.tsx` | 🔀 REDIRECT | Redirige vers `/dashboard/clients` | Route doublon à supprimer ou documenter |
| `/dashboard/reporting` | `dashboard/reporting/page.tsx` | 🔀 REDIRECT | Redirige vers `/dashboard/rapports` | Route doublon à supprimer ou documenter |

### Routes référencées dans le code mais SANS page dédiée

| Route référencée | Contexte | Statut |
|-----------------|----------|--------|
| `/dashboard/transactions?type=depot` | DashboardCard (onClick) | ❌ Query param — page existe mais filtre auto non implémenté |
| `/dashboard/transactions?type=retrait` | DashboardCard (onClick) | ❌ Query param — idem |
| `/dashboard/agents/:id` | Bouton "Voir" agents | ❌ MANQUANT — page détail agent |
| `/dashboard/agences/:id` | Probable navigation | ❌ MANQUANT — page détail agence |
| `/dashboard/clients/:id` | Probable navigation | ❌ MANQUANT — page détail client |
| `/dashboard/transactions/:id` | Possible | ❌ MANQUANT — modal existe mais pas de page dédiée |

### Modules avec données Prisma mais SANS page frontend

| Module métier | Modèle(s) Prisma | Route suggérée |
|--------------|-----------------|---------------|
| Comptabilité | AccountChart, JournalEntry, Ledger, FiscalYear | `/dashboard/comptabilite` |
| RH / Paie | Employee, Contract, Payroll, Leave | `/dashboard/rh` |
| Stock | Product, Inventory, StockMovement | `/dashboard/stock` |
| Audit logs | AuditLog | `/dashboard/audit` |
| KYC | KycVerification | `/dashboard/kyc` |
| Intégrations | IntegrationLog | `/dashboard/integrations` |
| Rôles & Permissions | Role, Permission, RolePermission | `/dashboard/roles` |
| Annulations | Reversal | `/dashboard/annulations` |
| Super-agents | SuperAgent | `/dashboard/super-agents` |
| ML / Fraude | FraudAlert, MlPrediction | `/dashboard/fraude` |
| Taux de change | ExchangeRate | `/dashboard/taux-change` |

---

## ESPACE SUPERADMIN IBIG SOFT (`/superadmin/*`)

| Route | Fichier page | Statut | Description | Anomalies |
|-------|-------------|--------|-------------|-----------|
| `/superadmin` | `superadmin/page.tsx` | ⚠️ PARTIEL | Dashboard SA — stats tenants, utilisateurs, revenus, tickets, santé API | **DONNÉES MOCK** — `MOCK_STATS` et `MOCK_TENANTS` hardcodés |
| `/superadmin/prospects` | `superadmin/prospects/page.tsx` | À analyser | CRM prospects | — |
| `/superadmin/demonstrations` | `superadmin/demonstrations/page.tsx` | À analyser | Gestion des démos | — |
| `/superadmin/offres` | `superadmin/offres/page.tsx` | À analyser | Offres commerciales | — |
| `/superadmin/licences` | `superadmin/licences/page.tsx` | À analyser | Moteur de licences | — |
| `/superadmin/paiements` | `superadmin/paiements/page.tsx` | À analyser | Paiements SaaS | — |
| `/superadmin/emails` | `superadmin/emails/page.tsx` | À analyser | Templates et logs emails | — |
| `/superadmin/sara` | `superadmin/sara/page.tsx` | À analyser | Configuration SARA IA | — |
| `/superadmin/analytics` | `superadmin/analytics/page.tsx` | À analyser | Analytics globaux | — |

### Routes SuperAdmin MANQUANTES (CDC)

| Route suggérée | Description |
|---------------|-------------|
| `/superadmin/tenants` | Gestion des tenants (actif dans Prisma, pas de page dédiée) |
| `/superadmin/users` | Gestion des utilisateurs globaux |
| `/superadmin/audit` | Logs d'audit globaux |
| `/superadmin/config` | Configuration système IBIG Soft |

---

## PROTECTION DES ROUTES (middleware.ts)

| Type de route | Protection | Mécanisme |
|---------------|-----------|-----------|
| Routes publiques | Aucune | Liste `PUBLIC_ROUTES` explicite |
| Toutes autres routes | JWT cookie `gestmoney_token` | Présence + structure 3 parties |
| `/superadmin/*` | JWT + rôle `SUPER_ADMIN` | Lecture payload sans vérification signature |
| `/dashboard/*` | JWT uniquement | **Aucune vérification de rôle** |
| Expiration token | Redirection `/login` | `payload.exp * 1000 < Date.now()` |
| Token invalide | Redirection `/login` + suppression cookie | try/catch |

### Anomalie de sécurité (middleware)
- La signature JWT n'est pas vérifiée côté Edge (Next.js middleware). Un token structurellement valide mais cryptographiquement forgé passerait.
- Les routes `/dashboard/*` ne sont protégées que par la présence d'un token, pas par le rôle de l'utilisateur.

---

## RÉSUMÉ CHIFFRÉ

| Catégorie | Nombre |
|-----------|--------|
| Routes dashboard tenant existantes | 17 |
| Routes OK (complètes) | 8 |
| Routes PARTIELLES | 7 |
| Routes REDIRECT (doublons) | 2 |
| Routes référencées sans page | 6 |
| Modules API sans page frontend | 11 |
| Routes SuperAdmin existantes | 9 |
| Routes SuperAdmin manquantes (CDC) | 4 |
