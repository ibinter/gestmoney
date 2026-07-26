# AUDIT PERFORMANCE — GESTMONEY

> Généré le 2026-07-26 | Source : apps/api/src/**/*.service.ts

## findMany sans pagination (risque de timeout sur grands volumes)

| Fichier | Requête | Problème | Correction recommandée |
|---|---|---|---|
| `accounting.service.ts:68` | `accountChart.findMany({where: {tenantId}})` | Pas de `take` — peut retourner tout le plan comptable | Ajouter `take: 200` (plan comptable limité) ou paginer |
| `accounting.service.ts:333` | `accountChart.findMany(...)` | Même requête dans calcul bilan | Idem |
| `accounting.service.ts:446` | `journalEntry.findMany(...)` | Journal potentiellement massif | Ajouter `take` + `skip` |
| `accounting.service.ts:495` | `journalLine.findMany(...)` | Lignes journal sans limite | Filtrer par exercice fiscal + paginer |
| `accounting.service.ts:530` | `journalLine.findMany(...)` | Idem | Paginer |
| `accounting.service.ts:608` | `journalLine.findMany(...)` | Idem | Paginer |
| `accounting.service.ts:686` | `journalLine.findMany(...)` | Idem | Paginer |
| `accounting.service.ts:773` | `journalLine.findMany(...)` | Idem dans bilan | Paginer |
| `accounting.service.ts:996` | `journalEntry.findMany({where: {tenantId}})` | Toutes écritures sans limite | Ajouter filtre date + pagination |
| `commissions.service.ts:294` | `transaction.findMany(...)` | Toutes transactions pour calcul | Ajouter filtre date obligatoire |
| `commissions.service.ts:488` | `commissionEarning.findMany({where})` | Gains sans limite | Ajouter pagination |
| `float.service.ts:152` | `floatAccount.findMany(...)` | Tous comptes float | Généralement limité par tenant — acceptable |
| `float.service.ts:197` | `floatAccount.findMany(...)` | Idem | Acceptable |
| `float.service.ts:218` | `network.findMany(...)` | Tous réseaux | Généralement faible volume — acceptable |
| `audit.service.ts:316` | `auditLog.findMany(...)` pour export | Export CSV peut être massif | Ajouter filtre date obligatoire (déjà en query param) |
| `customers.service.ts:316` | `customer.findMany(...)` | Import/export | Ajouter pagination |

## Requêtes N+1 potentielles

| Fichier | Pattern | Risque |
|---|---|---|
| `agents.service.ts:64` | `role.findMany` dans boucle d'assignation | Faible — opération rare |
| `commissions.service.ts:406` | `commissionPlan.findMany` puis calcul par agent | Moyen — `include` bien structuré évite le N+1 |
| `accounting.service.ts:773` | `journalLine.findMany` dans boucle de comptes | Élevé — peut générer N requêtes pour N comptes |

## Index manquants identifiés

| Modèle | Champ | Note |
|---|---|---|
| `MlPrediction` | `tenantId` | Pas d'`@@index([tenantId])` visible |
| `AnalyticsEvent` | `tenantId` | Vérifier index |
| `JournalLine` | `(tenantId, journalEntryId)` | Index composite recommandé pour les rapports financiers |

## Normalisation de la pagination

Un utilitaire `normaliserPagination` existe dans `apps/api/src/common/utils/pagination.ts` (utilisé dans `notifications.service.ts`) mais n'est pas systématiquement appliqué. 

**Modules sans pagination côté service** :
- `accounting` (la plupart des méthodes)
- `commissions` (calcul et export)
- `float` (résumé réseau)

## Recommandations prioritaires

1. **P1** — Ajouter un plafond de 1 000 lignes sur toutes les requêtes `findMany` dans `accounting.service.ts`
2. **P1** — Forcer un filtre de date (30 jours max par défaut) sur les exports de journal et d'audit
3. **P2** — Implémenter cursor-based pagination pour les transactions (volume élevé)
4. **P2** — Ajouter `@@index([tenantId, createdAt])` sur `JournalLine` et `JournalEntry`
5. **P3** — Profiler les requêtes en production avec Prisma query log level
