# AUDIT GLOBAL — GESTMONEY vs SCRIPT UNIVERSEL IBIG SOFT

> Réponse initiale exigée par la section 42 du script universel. Chaque ligne
> est fondée sur l'état RÉEL du code en production (`gestmoney.ibigsoft.com`),
> pas sur des intentions. Légende : ✅ fait · 🟡 partiel · ❌ manquant.

## Contexte détecté (points 1-2 du §42)
- **Stack** : NestJS 10 (apps/api) + Next.js 14 App Router (apps/web) + Prisma 5 / PostgreSQL + Redis, Docker Compose sur VPS. **PAS Laravel** — le §19 et le §20.3 du script parlent de Laravel ; ici tout est TypeScript. Les recettes Laravel (artisan, Blade) sont donc à transposer, ce qui est déjà fait pour ce qui existe.
- **Base** : 71 tables. Migrations Prisma. Multi-tenant via `tenantId`.
- **État général** : socle très avancé. Le produit tourne, s'authentifie, facture (module paiement), traduit à 100 %, a SARA branché sur Groq. Reste surtout du volume commercial/éditorial et du durcissement.

## Cartographie des 30 points

| # | Domaine (§42) | État | Détail |
|---|---|---|---|
| 3 | Bugs / risques | 🟡 | Corrigés cette session : 5 endpoints 500, fuite d'infos dans les erreurs, pagination null (9 services), hydratation, fuite SW. **Restant** : hooks front qui retombent SILENCIEUSEMENT sur fixtures (masque les pannes) ; `/dashboard/extended-stats`, `/auth/sessions`, `/caisse/stats`, `/roles` en 404 → KPI dashboard = données de démo. |
| 4 | Écart cahier des charges | 🟡 | Voir MATRICE ci-dessous. |
| 5 | Identité visuelle / design system | ✅ | Design system porté depuis /mockup (`gm-*`), thème clair par défaut, tokens centralisés. Landing avec identité propre (#f8fef9 / #009E00 / #FFD000). |
| 6 | Responsivité / scroll horizontal | ✅ | Audit 375/768/1440 fait, débordements corrigés (topbar-right, 4 pages), zones tactiles 44px. Bloc de surcharge CSS final. Reste à tester 320/360/390/412 et zoom 125-150 %. |
| 7 | Encodage / UTF-8 | ✅ | Aucun `�` en prod (vérifié). Seeds en échappement JSON pour bash/Windows. |
| 8 | Landing (34 zones) | 🟡 | ~18/34 présentes. Voir §Landing ci-dessous. |
| 9 | Licences / abonnements | ✅ | Cycle de vie complet (essai/grâce/provisoire/renouvellement anticipé), **LicenceGuard globale** (402), scheduler, 38 tests. Anti-fuite §18.5 : la plupart cochés. |
| 10 | Paiements | ✅ | Module complet : 10 moyens configurables en base, secrets AES-256-GCM, webhooks HMAC + idempotence, preuves SHA256, vouchers. 24 configs seedées (23 désactivées, en attente de vraies coordonnées). |
| 11 | Console Superadmin | 🟡 | Accueil câblé sur `/tenants/stats` (réel). **8 sous-écrans = maquettes** (prospects, offres, paiements, licences, analytics, emails, démonstrations, sara) : aucune API, données en dur. Les 13 tables CRM existent mais sont inutilisées. |
| 12 | Rôles / permissions / isolation | 🟡 | RBAC présent (JwtAuthGuard + RolesGuard + @Roles). Isolation par `tenantId`. **Manque** : tests automatisés de séparation inter-sociétés (§17.3), et un audit systématique des 5 niveaux (menu/route/contrôleur/service/export). |
| 13 | SARA (public + interne) + IA config | ✅ | Base de connaissance des 19 modules, honnête sur les limites, 3 contextes. Groq branché et opérationnel. Bulle sur dashboard ET landing. **Manque** : RAG documentaire, quotas par user/société, fournisseur de secours, admin IA en base (aujourd'hui via env). |
| 14 | PWA / hors ligne | 🟡 | Manifest + SW v2 (ne cache plus les pages authentifiées — fuite corrigée). **Manque** : file d'attente hors ligne (formulaires), notification de mise à jour du SW, tests Android/iOS. |
| 15 | Multilingue / orthographe | ✅ | i18n 100 % (2471 clés, parité fr/en vérifiée par script). **Manque** : passe orthographique dédiée §22 (espaces insécables, guillemets « »), recette visuelle EN page par page. |
| 16 | Emails automatiques | ❌ | Listener d'événements présent (paiement/licence), gabarits écrits, MAIS **Nodemailer non branché** (envois simulés/loggés). Les 13 déclencheurs du §20 ne partent pas réellement. SMTP à configurer. |
| 17 | Exports / imports / documents / QR | 🟡 | Exports CSV présents (transactions, agents…). **Manque** : moteur d'import XLSX/CSV, exports PDF/XLSX riches, moteur de modèles de documents, QR de vérification (§24). |
| 18 | CRM / démos / offres | ❌ | Écrans SuperAdmin = maquettes. Tables existent (prospects, demonstrations, offres) mais **aucun backend** ne les alimente. |
| 19 | Guide / FAQ / cas pratiques / Académie | 🟡 | Guide 19 modules + 100 FAQ ✅ (en ligne, i18n). **Manque** : export PDF pro du guide, cas pratiques structurés, Académie/vidéos. |
| 20 | Support / tickets / centre d'aide | 🟡 | Pages support/aide/FAQ présentes (UI). Tables tickets existent. **Manque** : backend tickets réel (aujourd'hui mock), SLA, aide contextuelle « ? » par page. |
| 21 | Intégrations / API / webhooks | 🟡 | Webhooks paiement signés ✅. **Manque** : page d'admin intégrations, statuts Disponible/En intégration/Bientôt, rate limiting API, doc API. |
| 22 | Sécurité / journal d'audit | 🟡 | Filtre d'exception sans fuite ✅, secrets chiffrés ✅, HMAC ✅. Journal d'audit : table + endpoints OK mais **`AuditService.log()` n'est appelé nulle part** → journal vide. Manque : CSP/headers, rate limiting connexion, MFA réel. |
| 23 | Sauvegardes / restauration | ❌ | Dumps manuels faits pendant les migrations. **Aucun système** de sauvegarde planifiée/restauration dans le produit. |
| 24 | Performance / observabilité | 🟡 | Pagination partout, react-query. **Manque** : page santé services (§29.2), suivi CRON/SMTP/IA, skeleton loaders généralisés. |
| — | Jest non exécutable | ❌ | `apps/api` n'a aucune config jest → les `*.spec.ts` (dont 38 pour les licences) ne tournent sous aucun script. |

## Matrice de conformité — priorités

**Déjà conforme (ne pas retoucher)** : design system, responsivité de base, i18n 100 %, licences + garde, paiements, SARA + Groq, encodage.

**Écarts à fort impact commercial/sécurité, réalistes à combler :**
1. 🔴 **Emails automatiques réels** (§20) — brancher Nodemailer/SMTP sur le listener existant. Sans ça, aucun reçu, aucune relance J-7/J-3/J-1 ne part. Impact direct sur les renouvellements.
2. 🔴 **Journal d'audit réellement alimenté** (§27) — `log()` existe mais n'est appelé nulle part. Traçabilité = zéro aujourd'hui.
3. 🟠 **Backend des 8 écrans SuperAdmin** (§15, §16) — prospects/offres/paiements/licences : tables prêtes, contrôleurs à écrire. Gros volume.
4. 🟠 **Pages légales** (§7.33) — 18 pages FR/EN. Actuellement partielles.
5. 🟠 **Bulle WhatsApp** (§7.31, §8) — en bas à gauche, contact humain. N'existe pas.
6. 🟠 **Landing : zones manquantes** (§7) — barre d'info, comparateur d'offres, intégrations avec statuts, sécurité, IBIG PARTNERS (existe déjà), autres logiciels, vidéo.
7. 🟡 **Config jest** — pour que les tests écrits servent.
8. 🟡 **Durcissement sécurité** — CSP/headers, rate limiting connexion.

## Décisions & garde-fous (respect §41)
- Rien ne sera déclaré « terminé » sans vérification réelle en prod.
- Aucune donnée fictive présentée comme réelle : les écrans sans source restent signalés.
- Pas de faux témoignages, pas de fausses intégrations « disponibles ».
- Les vrais secrets (SMTP, coordonnées de paiement) restent à la charge du propriétaire.

## Plan d'exécution proposé (ordre §40)
- **Vague A (socle/sécurité)** : emails SMTP réels + journal d'audit alimenté + config jest.
- **Vague B (commercial)** : backend SuperAdmin (prospects/offres/paiements réels) + bulle WhatsApp + zones landing manquantes.
- **Vague C (contenu/légal)** : 18 pages légales FR/EN + export PDF du guide + cas pratiques.
- **Vague D (qualité)** : durcissement sécurité, tests d'isolation multi-tenant, PWA hors ligne, recette responsive 320-412 + zoom.

Chaque vague : build, test réel en prod via l'agent `testeur-gestmoney`, compte rendu.
