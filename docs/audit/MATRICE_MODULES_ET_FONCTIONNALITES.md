# MATRICE MODULES & FONCTIONNALITÉS — GESTMONEY

> Généré le 2026-07-26 | Source : apps/api/src/

| Module | Fichier contrôleur | Routes (nb) | Rôles | Tests (.spec) | État |
|---|---|---|---|---|---|
| **accounting** | accounting.controller.ts | 18 | SA, NA, ACCOUNTANT | accounting.service.spec.ts | ✅ Fonctionnel |
| **agencies** | agencies.controller.ts | 7 | SA, NA, AM | — | ✅ Fonctionnel |
| **agents** | agents.controller.ts | 10 | SA, NA, AM, AGENT | — | ✅ Fonctionnel |
| **ai** | ai.controller.ts | 4 | JWT (partiel) | — | ⚠️ Stub (pas de LLM réel câblé) |
| **audit** | audit.controller.ts | 7 | JWT | — | ✅ Fonctionnel |
| **auth** | auth.controller.ts | 12 | Public + JWT | auth.service.spec.ts | ✅ Fonctionnel |
| **cashier** | cashier.controller.ts | 7 | SA, NA, AM, AGENT | — | ✅ Fonctionnel |
| **commissions** | commissions.controller.ts | 9 | SA, NA, ACCOUNTANT | commissions.service.spec.ts | ✅ Fonctionnel |
| **common** | (guards, decorators, utils) | — | — | — | ✅ Fonctionnel |
| **config** | — | — | — | — | Config NestJS |
| **config-app** | config-app.controller.ts | 10 | JWT (±Rôles) | — | ✅ Fonctionnel |
| **customers** | customers.controller.ts | 14 | JWT (±Rôles) | — | ✅ Fonctionnel |
| **document-verification** | document-verification.controller.ts | 2 | Public + JWT | — | ✅ Fonctionnel |
| **float** | float.controller.ts | 11 | SA, NA, AM, AGENT | float.service.spec.ts | ✅ Fonctionnel |
| **gateway** | (WebSocket) | — | JWT | — | ⚠️ Présent, non testé |
| **hr** | hr.controller.ts | 14 | JWT (guards commentés) | — | ⚠️ Partiel (guards désactivés) |
| **integrations** | integrations.controller.ts | 6 | JWT | — | ⚠️ Sync simulée |
| **kyc** | kyc.controller.ts | 6 | JWT + Rôles | — | ✅ Fonctionnel |
| **licences** | licences.controller.ts | 6 | SA | licences.service.spec.ts, licence.guard.spec.ts, licences.module.spec.ts | ✅ Fonctionnel |
| **networks** | networks.controller.ts | ~6 | SA, NA | — | ✅ Fonctionnel |
| **notifications** | notifications.controller.ts | ~4 | JWT | — | ⚠️ Email partiel, SMS/Push no-op |
| **payments** | payments.controller.ts, payments-admin.controller.ts, webhooks.controller.ts | ~15 | JWT + SA | — | ⚠️ Webhook réel non câblé |
| **prisma** | prisma.service.ts | — | — | — | ✅ Fonctionnel |
| **public-leads** | public-leads.controller.ts | ~3 | Public | — | ✅ Fonctionnel |
| **reporting** | reporting.controller.ts | ~8 | JWT | — | ⚠️ Partiellement réel |
| **roles** | roles.controller.ts | ~5 | SA, NA | — | ✅ Fonctionnel |
| **stock** | stock.controller.ts | ~8 | JWT + Rôles | — | ⚠️ Backend OK, frontend partiel |
| **superadmin/crm** | demonstrations.controller.ts, offres.controller.ts, prospects.controller.ts | ~15 | SA | — | ✅ Fonctionnel |
| **superadmin/ops** | ops.controller.ts | ~5 | SA | — | ✅ Fonctionnel |
| **support** | support.controller.ts | ~8 | JWT | — | ✅ Fonctionnel |
| **tenants** | tenants.controller.ts | ~6 | SA | — | ✅ Fonctionnel |
| **transactions** | transactions.controller.ts | ~10 | JWT + Rôles | transactions.service.spec.ts | ✅ Fonctionnel |
| **users** | users.controller.ts | ~8 | JWT + Rôles | — | ✅ Fonctionnel |

---

## Récapitulatif

| Statut | Modules | Pourcentage |
|---|---|---|
| ✅ Fonctionnel | 22 | 65% |
| ⚠️ Partiel | 9 | 26% |
| ❌ Absent | 0 | 0% |
| Config/Infra | 3 | 9% |

**Total modules NestJS : 34**

---

## Modules partiels — détail

| Module | Blocage | Action requise |
|---|---|---|
| **hr** | Guards commentés sur certaines routes | Restaurer `@Roles` |
| **ai** | Pas de LLM réel câblé (chat retourne stub) | Intégrer Claude API |
| **notifications** | SMS/Push no-op | Implémenter Twilio + FCM |
| **payments** | Webhook provider non implémenté | Câbler Stripe/PayDunya/CinetPay |
| **integrations** | Sync opérateur simulée | Implémenter API opérateurs |
| **reporting** | Certains KPIs tombent sur fixtures frontend | Valider tous les endpoints |
| **stock** | Frontend partiel | Compléter les pages stock |
| **gateway** | WebSocket non testé | Test + validation |
| **ai** | SARA sans mémoire persistante | Câbler `SaraConversation` |
