# PLAN_FINALISATION.md — GESTMONEY

> **Version :** 2.0 | **Date :** 2026-07-13 | **Éditeur :** IBIG Soft

---

## PHASE 1 — Sécurité & Fondations ✅ EN COURS

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 1.1 | Créer middleware.ts (protection routes serveur) | `apps/web/src/middleware.ts` | ✅ Fait |
| 1.2 | Supprimer auto-login démo du layout dashboard | `app/(dashboard)/layout.tsx` | ✅ Fait |
| 1.3 | Supprimer credentials hardcodés login page | `app/(auth)/login/page.tsx` | ✅ Fait |
| 1.4 | Route API demo-access côté serveur | `app/api/demo-access/route.ts` | ✅ Fait |
| 1.5 | Corriger CORS wildcard next.config.js | `next.config.js` | ✅ Fait |
| 1.6 | Ajouter output:standalone + security headers | `next.config.js` | ✅ Fait |
| 1.7 | Créer manifest.json PWA | `public/manifest.json` | ✅ Fait |
| 1.8 | Créer service worker sw.js | `public/sw.js` | ✅ Fait |
| 1.9 | Page hors-ligne offline.html | `public/offline.html` | ✅ Fait |
| 1.10 | Composant PwaRegister + enregistrement SW | `components/ui/PwaRegister.tsx` | ✅ Fait |
| 1.11 | Mettre à jour root layout (metadata, viewport, PWA) | `app/layout.tsx` | ✅ Fait |
| 1.12 | Documenter audit sécurité | `AUDIT_SECURITE.md` | ✅ Fait |

---

## PHASE 2 — Base de données & Modules manquants

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 2.1 | Ajouter modèles Prisma : Prospect, Demonstration, Offre, LicenceEvent, SaraConversation | `schema.prisma` | ⏳ |
| 2.2 | Migration Prisma `20260713_crm_sara_licences` | `packages/database/prisma/migrations/` | ⏳ |
| 2.3 | Migrer JWT vers cookie httpOnly (API + web) | `auth.service.ts` + `authStore.ts` | ⏳ |
| 2.4 | Ajouter CSP headers sécurité next.config.js | `next.config.js` | ⏳ |
| 2.5 | Fusionner double authStore | `store/auth.store.ts` | ⏳ |
| 2.6 | Implémenter `/dashboard/customers` | `app/(dashboard)/dashboard/customers/page.tsx` | ⏳ |
| 2.7 | Implémenter `/dashboard/reporting` | `app/(dashboard)/dashboard/reporting/page.tsx` | ⏳ |
| 2.8 | Implémenter pages manquantes : HR, KYC, Stock, Accounting | Dashboard pages | ⏳ |
| 2.9 | Brancher notifications sur API réelle | `hooks/useNotifications.ts` | ⏳ |
| 2.10 | Rate limiting calibré auth (10 req/60s) | `apps/api/src/app.module.ts` | ⏳ |

---

## PHASE 3 — Design, Responsive, PWA complète

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 3.1 | Créer icônes PWA (72, 96, 128, 144, 152, 192, 384, 512 px) | `public/icons/` | ⏳ |
| 3.2 | Créer favicon.svg optimisé | `public/favicon.svg` | ⏳ |
| 3.3 | Bannière installation PWA (composant) | `components/ui/PwaInstallBanner.tsx` | ⏳ |
| 3.4 | Corriger scroll horizontal global (audit + fix) | `globals.css` + pages | ⏳ |
| 3.5 | Tester responsive 320px–1920px toutes pages | Toutes pages | ⏳ |
| 3.6 | Header mobile (hamburger + drawer plein écran) | `components/ui/Topbar.tsx` | ⏳ |
| 3.7 | Tables avec overflow-x:auto | Toutes tables dashboard | ⏳ |
| 3.8 | Formulaires responsives | Toutes les pages | ⏳ |
| 3.9 | Pages légales (FR + EN) | `app/legal/` | ⏳ |
| 3.10 | Bannière cookies avec consentement | `components/ui/CookieBanner.tsx` | ⏳ |
| 3.11 | Pages 404 et 500 personnalisées GESTMONEY | `app/not-found.tsx`, `app/error.tsx` | ⏳ |

---

## PHASE 4 — Landing Page Commerciale

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 4.1 | Barre d'annonce administrable | `app/page.tsx` | ⏳ |
| 4.2 | Hero dynamique avec slides | `app/page.tsx` | ⏳ |
| 4.3 | Section tarifs/offres | `app/page.tsx` | ⏳ |
| 4.4 | Section FAQ accordéon | `app/page.tsx` | ⏳ |
| 4.5 | Section témoignages | `app/page.tsx` | ⏳ |
| 4.6 | Section IBIG Partners | `app/page.tsx` | ⏳ |
| 4.7 | Section autres logiciels IBIG Soft | `app/page.tsx` | ⏳ |
| 4.8 | Section installation PWA | `app/page.tsx` | ⏳ |
| 4.9 | Formulaire demande démo | `app/page.tsx` | ⏳ |
| 4.10 | Footer complet (6 colonnes) | `app/page.tsx` | ⏳ |
| 4.11 | SEO : sitemap.xml + robots.txt | `app/sitemap.ts`, `public/robots.txt` | ⏳ |

---

## PHASE 5 — SuperAdmin & CRM

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 5.1 | SuperAdmin : gestion tenants/clients | `app/(dashboard)/superadmin/tenants/` | ⏳ |
| 5.2 | SuperAdmin : CRM prospects + pipeline | `app/(dashboard)/superadmin/prospects/` | ⏳ |
| 5.3 | SuperAdmin : gestion démonstrations | `app/(dashboard)/superadmin/demonstrations/` | ⏳ |
| 5.4 | SuperAdmin : offres & tarifs | `app/(dashboard)/superadmin/offres/` | ⏳ |
| 5.5 | SuperAdmin : moteur licences | `app/(dashboard)/superadmin/licences/` | ⏳ |
| 5.6 | SuperAdmin : paiements & factures | `app/(dashboard)/superadmin/paiements/` | ⏳ |
| 5.7 | SuperAdmin : config SARA & IA | `app/(dashboard)/superadmin/sara/` | ⏳ |
| 5.8 | SuperAdmin : analytics globales | `app/(dashboard)/superadmin/analytics/` | ⏳ |
| 5.9 | SuperAdmin : santé plateforme + logs | `app/(dashboard)/superadmin/infra/` | ⏳ |
| 5.10 | SuperAdmin : templates emails | `app/(dashboard)/superadmin/emails/` | ⚠️ Partiel |

---

## PHASE 6 — SARA & IA

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 6.1 | Module NestJS AI (Groq + OpenAI + Anthropic) | `apps/api/src/ai/` | ⏳ |
| 6.2 | Endpoint API `/ai/chat` (multifournisseur) | `ai/ai.controller.ts` | ⏳ |
| 6.3 | Base de connaissances RAG | `apps/api/src/ai/rag/` | ⏳ |
| 6.4 | Composant SARA (chat flottant responsive) | `components/ui/AssistantIA.tsx` | ⚠️ Stub |
| 6.5 | SARA publique (landing page) | `app/page.tsx` | ⏳ |
| 6.6 | SARA interne (dashboard) | `components/ui/AssistantIA.tsx` | ⏳ |
| 6.7 | CRM prospect depuis SARA | intégré | ⏳ |

---

## PHASE 7 — Emails & Licences

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 7.1 | Bull queue emails (NestJS) | `apps/api/src/mail/` | ⏳ |
| 7.2 | Templates emails brandés (12 séquences) | `lib/emailTemplates.ts` | ⚠️ Partiel |
| 7.3 | CRON J-7, J-3, J-1, J+1 | `mail/mail.scheduler.ts` | ⏳ |
| 7.4 | Email inscription bienvenue | `mail/templates/` | ⏳ |
| 7.5 | Email paiement réussi + reçu PDF | `mail/templates/` | ⏳ |
| 7.6 | Moteur licences côté API (guard + check) | `apps/api/src/licences/` | ⏳ |
| 7.7 | Intégration paiement (architecture) | `apps/api/src/payments/` | ⏳ |

---

## PHASE 8 — Support & Guide

| # | Tâche | Fichier | Statut |
|---|-------|---------|--------|
| 8.1 | Centre d'aide base de connaissances | `app/(dashboard)/dashboard/aide/` | ⚠️ Partiel |
| 8.2 | Système tickets support | `app/(dashboard)/dashboard/support/` | ⚠️ Partiel |
| 8.3 | Guide utilisateur complet (FR + EN) | `public/guide/` | ⏳ |
| 8.4 | Export guide en PDF | `/api/guide/pdf` | ⏳ |

---

## PHASE 9 — Tests & Déploiement

| # | Tâche | Statut |
|---|-------|--------|
| 9.1 | Tests fonctionnels auth + middleware | ⏳ |
| 9.2 | Tests responsive 320px–1920px | ⏳ |
| 9.3 | Tests isolation multi-tenant | ⏳ |
| 9.4 | Tests PWA install (Android + Windows) | ⏳ |
| 9.5 | Tests exports PDF/XLSX | ⏳ |
| 9.6 | Tests SARA (LLM réponses) | ⏳ |
| 9.7 | Tests sécurité (IDOR, XSS, SQLi) | ⏳ |
| 9.8 | Audit performance (Lighthouse) | ⏳ |
| 9.9 | Déploiement VPS + vérification | ⏳ |
| 9.10 | Recette finale | ⏳ |

---

## CRITÈRES DE VALIDATION FINALE

Référence : cahier des charges section 47

- [ ] Cahier des charges respecté
- [ ] Design cohérent
- [ ] Espace public responsive
- [ ] Espace interne responsive
- [ ] SuperAdmin responsive
- [ ] PWA fonctionnelle
- [ ] Menu mobile fonctionnel
- [ ] Aucun scroll horizontal global
- [ ] Multilingue FR/EN
- [ ] SARA fonctionnelle
- [ ] Offres administrables
- [ ] Licences sécurisées
- [ ] Emails testés
- [ ] CRM fonctionnel
- [ ] Tickets fonctionnels
- [ ] Guides existants
- [ ] PDF propres
- [ ] Permissions côté serveur
- [ ] Sociétés isolées
- [ ] Sauvegardes testées
- [ ] Tests passants
- [ ] Documentation fournie
