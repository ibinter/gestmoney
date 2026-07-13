# AUDIT_SECURITE.md — GESTMONEY

> **Date :** 2026-07-13 | **Auditeur :** Claude Code / IBIG Soft

---

## 1. RÉSUMÉ EXÉCUTIF

| Niveau | Nombre | Statut |
|--------|--------|--------|
| 🔴 Critique | 5 | 3 corrigés Phase 1, 2 en cours |
| 🟠 Élevé | 4 | 1 corrigé, 3 planifiés |
| 🟡 Moyen | 6 | Planifiés Phase 2 |
| 🟢 Faible | 3 | Planifiés Phase 3 |

---

## 2. VULNÉRABILITÉS CRITIQUES

### S1 — Credentials démo hardcodés côté client ❌ → ✅ CORRIGÉ Phase 1
- **Fichier :** `apps/web/src/app/(auth)/login/page.tsx`
- **Problème :** `DEMO_EMAIL` et `DEMO_PASSWORD` visibles dans le bundle JS client
- **Risque :** Toute personne inspectant le code source peut accéder à l'application
- **Correction :** Variables déplacées en `process.env` serveur uniquement, route API `/api/demo-access` dédiée
- **Statut :** ✅ Corrigé

### S2 — Auto-login démo dans le layout dashboard ❌ → ✅ CORRIGÉ Phase 1
- **Fichier :** `apps/web/src/app/(dashboard)/layout.tsx`
- **Problème :** `useEffect` crée une session démo si non authentifié → accès libre au dashboard
- **Risque :** Toute URL `/dashboard/*` accessible sans authentification
- **Correction :** Redirection vers `/login` si non authentifié
- **Statut :** ✅ Corrigé

### S3 — Absence de middleware Next.js ❌ → ✅ CORRIGÉ Phase 1
- **Fichier :** `middleware.ts` (inexistant)
- **Problème :** Protection des routes 100% client-side, contournable via désactivation JS
- **Risque :** Accès direct à `/dashboard` et `/superadmin` sans authentification
- **Correction :** `middleware.ts` créé avec vérification JWT Edge, redirection login
- **Statut :** ✅ Corrigé

### S4 — JWT stocké en localStorage ❌ → EN COURS Phase 2
- **Fichier :** `apps/web/src/store/authStore.ts`
- **Problème :** Token accessible via `localStorage.getItem()` depuis n'importe quel script JS (XSS)
- **Risque :** Vol de token en cas d'injection XSS
- **Correction prévue :** Migrer vers cookie httpOnly, Secure, SameSite=Strict
- **Statut :** ⏳ Phase 2

### S5 — Accès SuperAdmin protection client-side uniquement ❌ → ✅ PARTIELLEMENT CORRIGÉ
- **Fichier :** `apps/web/src/app/(dashboard)/superadmin/page.tsx`
- **Problème :** `if (user?.role !== 'SUPER_ADMIN') router.replace('/dashboard')` côté client
- **Risque :** Contournement possible si JS désactivé ou middleware absent
- **Correction Phase 1 :** Middleware.ts vérifie le rôle JWT côté serveur
- **Correction Phase 2 :** Guard NestJS API + RolesGuard sur toutes les routes superadmin
- **Statut :** ⚠️ Partiellement corrigé

---

## 3. VULNÉRABILITÉS ÉLEVÉES

### S6 — CORS wildcard `*` dans next.config.js ❌ → ✅ CORRIGÉ Phase 1
- **Fichier :** `apps/web/next.config.js`
- **Problème :** `Access-Control-Allow-Origin: *` autorise toute origine
- **Risque :** CSRF potentiel, requêtes cross-origin non maîtrisées
- **Correction :** CORS limité aux origines dans `CORS_ORIGINS` env
- **Statut :** ✅ Corrigé

### S7 — Stack trace exposée en production
- **Fichier :** `apps/api/src/common/filters/http-exception.filter.ts` (à vérifier)
- **Problème :** Message d'erreur interne potentiellement exposé
- **Correction prévue :** Filtre d'exception masquant les détails en production
- **Statut :** ⏳ Phase 2

### S8 — Absence de Content Security Policy
- **Problème :** Pas de header CSP → XSS facilité
- **Correction prévue :** CSP strict via next.config.js headers
- **Statut :** ⏳ Phase 2

### S9 — Validation MIME upload absente
- **Problème :** Upload de fichiers sans vérification MIME côté client ni serveur
- **Correction prévue :** Validation NestJS + vérification magic bytes
- **Statut :** ⏳ Phase 2

---

## 4. VULNÉRABILITÉS MOYENNES

### S10 — Rate limiting non configuré côté web
- ThrottlerModule présent API mais non calibré pour les endpoints auth
- **Action :** Configurer TTL=60, limit=10 sur `/auth/login`

### S11 — 2FA non implémentée (champ DB présent)
- Champ `twoFactorSecret` dans Prisma mais logique absente
- **Action :** Implémenter TOTP Phase 3

### S12 — Sessions non révocables en masse
- Table `sessions` présente mais endpoint "déconnecter tous les appareils" absent
- **Action :** Ajouter endpoint `/auth/sessions/revoke-all`

### S13 — Absence de journal d'audit pour actions sensibles web
- AuditLog présent API mais non déclenché sur actions dashboard
- **Action :** Brancher AuditService sur actions CRUD depuis le frontend

### S14 — Emails de réinitialisation sans expiration vérifiée côté serveur
- À vérifier dans `auth.service.ts`

### S15 — Secrets dans `.env` commité (à vérifier)
- Vérifier que `.env` n'est pas dans le dépôt Git
- **Action :** `git rm --cached .env` si présent

---

## 5. CHECKLIST SÉCURITÉ

| Vérification | État |
|---|---|
| Helmet activé (API) | ✅ |
| Validation DTOs whitelist | ✅ |
| JWT dual-token (access+refresh) | ✅ |
| Brute force protection (failedLoginAttempts) | ✅ DB, ⚠️ vérifier impl. |
| TenantGuard sur routes métier | ✅ |
| RolesGuard sur routes sensibles | ✅ |
| HTTPS en production | ✅ (Nginx + Let's Encrypt) |
| Middleware route protection | ✅ Corrigé |
| Credentials hors code source | ✅ Corrigé |
| CORS restreint | ✅ Corrigé |
| CSP header | ❌ À faire |
| JWT en httpOnly cookie | ❌ À faire |
| Upload validation | ❌ À faire |
| Rate limiting auth | ⚠️ Partiel |
| 2FA | ❌ À faire |
| Audit log complet | ⚠️ Partiel |
| Secrets hors Git | ⚠️ À vérifier |

---

## 6. PRIORITÉS RESTANTES

**Phase 2 (immédiat) :**
1. Migrer JWT vers cookie httpOnly
2. Ajouter CSP dans next.config.js
3. Calibrer rate limiting auth
4. Vérifier exposition stack traces

**Phase 3 :**
5. Implémenter 2FA TOTP
6. Sessions révocables
7. Audit log complet
8. Validation MIME uploads
