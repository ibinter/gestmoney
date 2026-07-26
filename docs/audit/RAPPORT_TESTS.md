# RAPPORT DE TESTS — GESTMONEY

> Généré le 2026-07-26 | Source : apps/api/src/**/*.spec.ts

## Résumé

| Indicateur | Valeur |
|---|---|
| Fichiers .spec.ts | 8 |
| Modules testés | 6 / 34 (18%) |
| Modules sans test | 28 / 34 (82%) |
| Framework | Jest + NestJS Testing |
| Coverage configurée | Non (pas de `jest --coverage` dans scripts) |

---

## Fichiers de test existants

| Fichier | Lignes | Ce qui est testé |
|---|---|---|
| `auth/auth.service.spec.ts` | 300 | Login, logout, refresh token, register, forgot-password, 2FA (enable/verify), verrouillage compte après échecs |
| `transactions/transactions.service.spec.ts` | 260 | Création transaction, validation, filtres, calcul frais/commission |
| `accounting/accounting.service.spec.ts` | 311 | Création journal, plan comptable, bilan, compte de résultat, clôture exercice |
| `commissions/commissions.service.spec.ts` | 258 | Calcul commission, plans, paiements, résumé par agent |
| `float/float.service.spec.ts` | 223 | Float account, rechargement, approbation/rejet, seuils |
| `licences/licences.service.spec.ts` | 581 | Cycle de vie complet : essai, renouvellement, suspension, grâce, révocation, rappels |
| `licences/licence.guard.spec.ts` | 228 | Guard d'accès licence — statuts actifs vs inactifs, route @SansLicence |
| `licences/licences.module.spec.ts` | 33 | Vérification du module NestJS (providers, exports) |

---

## Modules sans aucun test

| Module | Risque | Priorité test |
|---|---|---|
| agencies | Moyen | P2 |
| agents | Moyen | P2 |
| cashier | Moyen | P2 |
| customers | Moyen | P2 |
| kyc | Moyen | P2 |
| notifications | Haute | P1 — SMS/email critiques |
| payments | Haute | P1 — flux financier critique |
| hr | Basse | P3 |
| stock | Basse | P3 |
| support | Basse | P3 |
| reporting | Moyen | P2 |
| audit | Basse | P3 |
| document-verification | Moyen | P2 |
| networks | Basse | P3 |
| users | Moyen | P2 |
| roles | Basse | P3 |
| config-app | Basse | P3 |
| integrations | Haute | P1 — intégrations opérateurs |
| superadmin (CRM/Ops) | Basse | P3 |
| ai | Basse | P3 |
| tenants | Moyen | P2 |

---

## Qualité des tests existants

| Module | Mocks utilisés | Tests positifs | Tests négatifs | Cas limites |
|---|---|---|---|---|
| auth | ✅ Prisma, bcrypt, otplib | ✅ | ✅ (UnauthorizedException) | ✅ (verrouillage, 2FA) |
| transactions | ✅ Prisma | ✅ | ✅ | ⚠️ Partiels |
| accounting | ✅ Prisma | ✅ | ✅ | ⚠️ Partiels |
| commissions | ✅ Prisma | ✅ | ✅ | ⚠️ Partiels |
| float | ✅ Prisma | ✅ | ✅ | ⚠️ Partiels |
| licences | ✅ Prisma, EventEmitter2 | ✅ | ✅ | ✅ Très complet |
| licence.guard | ✅ Prisma | ✅ | ✅ | ✅ Bon |
| licences.module | — | ✅ (instanciation) | — | — |

---

## Recommandations

1. **P1** — Ajouter des tests pour `payments.service.ts` (validation webhooks, calcul frais) — module financier critique.
2. **P1** — Ajouter des tests pour `notifications.service.ts` (vérifier que l'email est bien envoyé/loggé selon la config SMTP).
3. **P1** — Ajouter des tests pour `integrations.service.ts` (mock des réponses opérateurs).
4. **P2** — Activer `jest --coverage` dans `package.json` et fixer un seuil minimal à 70%.
5. **P2** — Ajouter des tests E2E avec Supertest pour les routes auth et transactions.
6. **P3** — Tester les guards (`JwtAuthGuard`, `RolesGuard`, `TenantGuard`) en isolation.
