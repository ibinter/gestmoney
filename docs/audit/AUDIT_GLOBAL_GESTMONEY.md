# AUDIT GLOBAL — GESTMONEY

> Généré le 2026-07-26 | Monorepo NestJS 14 + Next.js 14 App Router | PostgreSQL + Prisma

## Résumé exécutif

GESTMONEY est un SaaS multi-tenant de gestion financière pour réseaux d'agents (type Mobile Money). L'architecture est solide : 34 modules NestJS, schéma Prisma 2 240 lignes, frontend Next.js avec i18n fr/en. Le MVP est fonctionnel mais plusieurs modules restent partiellement câblés en production.

---

## Tableau d'état général

| Zone | État | Priorité | Note |
|---|---|---|---|
| **Auth JWT + 2FA** | ✅ Fonctionnel | P1 | Login, refresh token, forgot-password, 2FA TOTP implémentés |
| **Multi-tenant isolation** | ✅ Corrigé | P1 | Fuite inter-tenant détectée et corrigée (filtre tenantId systématique) |
| **Transactions** | ✅ Fonctionnel | P1 | CRUD complet, reversal, types opérateurs |
| **Agents & Agences** | ✅ Fonctionnel | P1 | CRUD, suspension/activation, statistiques |
| **Float management** | ✅ Fonctionnel | P1 | Seuils, alertes, rechargement, approbation |
| **Caisse (Cashier)** | ✅ Fonctionnel | P1 | Ouverture/clôture, mouvements, historique |
| **Commissions** | ✅ Fonctionnel | P2 | Plans, calcul, paiements, résumé par agent |
| **Clients (KYC)** | ✅ Fonctionnel | P2 | CRUD client + flux KYC complet (soumission/approbation/rejet) |
| **Comptabilité** | ✅ Fonctionnel | P2 | Plan comptable, journal, grand livre, bilan, compte de résultat |
| **Reporting** | ⚠️ Partiel | P2 | Routes backend présentes ; certains KPIs frontend tombent sur fixtures |
| **Notifications email** | ⚠️ Partiel | P2 | Nodemailer optionnel — repli sur log si non installé, SMS Twilio commenté |
| **Module RH** | ⚠️ Partiel | P3 | Employés, contrats, paie, congés — guards RolesGuard commentés |
| **Stock** | ⚠️ Partiel | P3 | Routes présentes, intégration frontend à compléter |
| **Intégrations opérateurs** | ⚠️ Partiel | P2 | Webhooks reçus, sync opérateur simulée |
| **Module IA / Fraude** | ⚠️ Partiel | P3 | Endpoints présents (chat, statut), ML predictions en DB mais non exposées |
| **Licences & abonnements** | ✅ Fonctionnel | P1 | Cycle de vie complet (essai/grâce/suspension), guard LicenceGuard actif |
| **SuperAdmin CRM** | ✅ Fonctionnel | P2 | Prospects, démos, offres — actions réelles câblées |
| **Support (tickets)** | ✅ Fonctionnel | P2 | Pièces jointes base64, résolution |
| **Vérification documents** | ✅ Fonctionnel | P2 | Token QR, route publique de vérification |
| **Audit & logs** | ✅ Fonctionnel | P2 | Export CSV, alertes fraude, stats |
| **Export CSV/Excel/PDF** | ✅ Fonctionnel | P2 | Côté web via pdfmake + exportCsv |
| **i18n fr/en** | ✅ Fonctionnel | P3 | 3 700 lignes fr, 3 666 en — légère divergence |
| **Tests unitaires** | ⚠️ Insuffisant | P2 | 8 fichiers .spec.ts seulement (auth, accounting, commissions, float, licences, transactions) |
| **Backup / restauration** | ❌ Absent | P2 | Aucun script de sauvegarde automatique |
| **CI/CD** | ⚠️ Manuel | P2 | Script `deploy-prod.sh` présent, pas de pipeline GitHub Actions |
| **Rate limiting** | ⚠️ Partiel | P1 | @nestjs/throttler importé mais configuration à vérifier |
| **CORS** | ✅ Configuré | P1 | Via variables d'environnement |
| **Pagination** | ⚠️ Partiel | P2 | `normaliserPagination` utilitaire présent mais non appliqué partout |

---

## Modules API (apps/api/src/)

accounting, agencies, agents, ai, audit, auth, cashier, commissions, common, config, config-app, customers, document-verification, float, gateway, hr, integrations, kyc, licences, main.ts, networks, notifications, payments, prisma, public-leads, reporting, roles, stock, superadmin (crm + ops), support, tenants, transactions, users

**Total : 34 modules NestJS**

## Pages Web (apps/web/src/app/)

- `(auth)/` : login, register
- `(dashboard)/` : dashboard, agents, agences, clients, caisse, float, commissions, transactions, reporting, comptabilite, stock, hr, support, notifications, settings, profile, kyc, audit, superadmin, abonnement, guide
- `verify/` : vérification publique de documents
- `legal/` : CGU, politique de confidentialité

---

## Risques majeurs identifiés

1. **SMS non implémenté** : Twilio commenté, envois SMS sont des no-op.
2. **Pagination absente** sur plusieurs `findMany` (accounting, commissions) — risque de timeout sur gros volumes.
3. **Tests insuffisants** : 8 spec pour 34 modules, couverture < 25 %.
4. **Backup absent** : aucune procédure de sauvegarde automatique de la base de données.
5. **Guard HR commenté** : module RH sans contrôle de rôle sur certaines routes.
