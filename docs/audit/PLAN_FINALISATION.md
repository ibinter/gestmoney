# PLAN DE FINALISATION — GESTMONEY

> Généré le 2026-07-26

## Vague 1 — Terminée (base fonctionnelle)

| Priorité | Tâche | État | Note |
|---|---|---|---|
| P0 | Auth JWT + refresh token | ✅ Fait | |
| P0 | Multi-tenant isolation (filtre tenantId) | ✅ Fait | Fuite corrigée |
| P0 | Transactions CRUD + reversal | ✅ Fait | |
| P0 | Agents & Agences CRUD | ✅ Fait | |
| P0 | Float management | ✅ Fait | |
| P0 | Caisse (ouverture/clôture) | ✅ Fait | |
| P0 | Commissions (plans + calcul + paiement) | ✅ Fait | |
| P0 | Clients + KYC | ✅ Fait | |
| P0 | Licences & abonnements (cycle de vie complet) | ✅ Fait | |
| P1 | Comptabilité (journal, bilan, compte de résultat) | ✅ Fait | |
| P1 | SuperAdmin CRM (prospects, démos, offres) | ✅ Fait | |
| P1 | Support (tickets + pièces jointes) | ✅ Fait | |
| P1 | Vérification documents (QR code) | ✅ Fait | |
| P1 | Audit logs + export CSV | ✅ Fait | |
| P1 | Export CSV/Excel/PDF (menu unifié) | ✅ Fait | |
| P1 | i18n fr/en | ✅ Fait | |
| P1 | Upload avatar (base64 JSON) | ✅ Fait | |
| P1 | 2FA TOTP | ✅ Fait | |
| P1 | Guide interactif intégré | ✅ Fait | |
| P1 | Footer landing page | ✅ Fait | |
| P1 | Gestion opérateurs réseau (CRUD Network) | ✅ Fait | |

## Vague 2 — À faire

| Priorité | Tâche | Effort | Dépendances | État |
|---|---|---|---|---|
| **P1** | Implémenter SMS Twilio / Africa's Talking | 2j | Compte opérateur | ❌ À faire |
| **P1** | Restaurer guards RH (@Roles dans hr.controller.ts) | 0.5j | — | ❌ À faire |
| **P1** | Activer et tester rate limiting (ThrottlerModule) | 1j | Config .env | ❌ À faire |
| **P1** | Backup PostgreSQL automatique (cron + dump) | 1j | Accès VPS | ❌ À faire |
| **P1** | Reçus de transaction PDF avec QR de vérification | 3j | pdfmake-node | ❌ À faire |
| **P2** | Tests unitaires (couvrir les modules sans spec) | 5j | — | ❌ À faire |
| **P2** | Pagination sur accounting.service.ts | 1j | — | ❌ À faire |
| **P2** | Push notifications (FCM/Expo) | 2j | Compte Firebase | ❌ À faire |
| **P2** | Import clients CSV (valider parsing backend) | 1j | — | ❌ À faire |
| **P2** | Webhook paiement réel (Stripe/PayDunya/CinetPay) | 3j | Compte provider | ❌ À faire |
| **P2** | CSP headers dans next.config.js | 0.5j | — | ❌ À faire |
| **P2** | Migration pièces jointes → stockage objet (MinIO) | 3j | MinIO/S3 | ❌ À faire |
| **P2** | CI/CD GitHub Actions (build + test + deploy) | 2j | GitHub repo | ❌ À faire |
| **P3** | Fiches de paie PDF (module RH) | 2j | RH guards | ❌ À faire |
| **P3** | Module IA SARA (intégration LLM réelle) | 5j | Clé API Claude | ❌ À faire |
| **P3** | Index DB manquants (JournalLine, MlPrediction) | 0.5j | Migration Prisma | ❌ À faire |
| **P3** | Forcer 2FA pour SA/NA | 1j | — | ❌ À faire |
| **P3** | Inventaire stock (intégration frontend complète) | 2j | — | ❌ À faire |

## Récapitulatif

| Vague | Tâches | Terminées | Effort restant estimé |
|---|---|---|---|
| Vague 1 | 21 | 21 (100%) | 0 |
| Vague 2 | 18 | 0 (0%) | ~38 jours-homme |
