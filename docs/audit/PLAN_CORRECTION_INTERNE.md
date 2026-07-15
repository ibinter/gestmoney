# PLAN DE CORRECTION INTERNE — GESTMONEY
> Date : 2026-07-15 | Basé sur l'audit du code source  
> Priorités : P1 = Bloquant production | P2 = Important qualité | P3 = Amélioration

---

## SYNTHÈSE EXÉCUTIVE

| Priorité | Nombre de tâches | Impact |
|----------|-----------------|--------|
| P1 — Critique / Bloquant | 7 tâches | Sécurité, données fictives, UX cassée |
| P2 — Majeur / Important | 12 tâches | Fonctionnalités incomplètes |
| P3 — Mineur / Amélioration | 10 tâches | Qualité code, i18n, expérience |

---

## PHASE P1 — CORRECTIONS CRITIQUES ET BLOQUANTES

> À traiter en priorité absolue avant tout déploiement en production.

---

### P1-01 · Connecter le dashboard SuperAdmin aux données réelles

**Gravité :** CRITIQUE  
**Fichier :** `apps/web/src/app/(dashboard)/superadmin/page.tsx`  
**Problème :** Les variables `MOCK_STATS` et `MOCK_TENANTS` affichent des données fictives comme réelles dans l'interface SuperAdmin.  

**Correction :**
1. Supprimer les constantes `MOCK_STATS` et `MOCK_TENANTS`
2. Créer un hook `useSuperAdminStats()` appelant `GET /api/tenants/stats`, `GET /api/reporting/global`, `GET /api/transactions/stats/global`
3. Ajouter des états de chargement (SkeletonCard existants)
4. Gérer les erreurs avec fallback UI

```typescript
// Remplacer :
const MOCK_STATS = { ... }
// Par :
const { data: stats, isLoading } = useSuperAdminStats();
```

---

### P1-02 · Corriger la race condition auth dans le layout dashboard

**Gravité :** CRITIQUE  
**Fichier :** `apps/web/src/app/(dashboard)/layout.tsx`  
**Problème :** Le layout s'affiche brièvement avant que `useEffect` redirige vers `/login`.

**Correction :**
```typescript
// Ajouter avant le return JSX :
if (!isAuthenticated) {
  return null; // ou un spinner
}
```

---

### P1-03 · Sécurité — Documenter la limite du middleware JWT

**Gravité :** CRITIQUE (sécurité)  
**Fichier :** `apps/web/src/middleware.ts`  
**Problème :** Le middleware décode le JWT sans vérifier la signature cryptographique. Un token forgé structurellement valide passerait le contrôle.

**Options de correction :**
- **Option A (recommandée)** : Ne pas vérifier le token côté Edge — laisser entièrement la vérification au backend NestJS. Le middleware ne fait que vérifier la présence d'un cookie.
- **Option B** : Utiliser la librairie `jose` (compatible Edge Runtime) pour vérifier la signature avec la clé publique JWT.

```typescript
// Option A — middleware simplifié :
const token = request.cookies.get('gestmoney_token')?.value;
if (!token) {
  return NextResponse.redirect(new URL('/login', request.url));
}
// Transmettre sans décoder — le backend vérifie
```

---

### P1-04 · Protection des routes dashboard par rôle

**Gravité :** CRITIQUE (sécurité)  
**Fichier :** `apps/web/src/middleware.ts` + composants dashboard  
**Problème :** Les routes `/dashboard/*` ne sont protégées que par la présence d'un JWT — n'importe quel rôle accède à tout.

**Correction (middleware) :**
```typescript
// Ajouter dans middleware.ts :
const ROLE_ROUTE_MAP: Record<string, string[]> = {
  '/dashboard/agents': ['SUPER_ADMIN', 'NETWORK_ADMIN', 'AGENCY_MANAGER'],
  '/dashboard/agences': ['SUPER_ADMIN', 'NETWORK_ADMIN', 'AGENCY_MANAGER'],
  '/dashboard/commissions': ['SUPER_ADMIN', 'NETWORK_ADMIN', 'ACCOUNTANT', 'AGENCY_MANAGER'],
};
```

**Correction (NestJS — prioritaire) :**
Appliquer `@Roles(...)` + `@UseGuards(JwtAuthGuard, RolesGuard)` sur tous les contrôleurs sensibles.

---

### P1-05 · Appliquer RolesGuard sur TransactionsController

**Gravité :** CRITIQUE (sécurité métier)  
**Fichier :** `apps/api/src/transactions/transactions.controller.ts`  
**Problème :** Tout utilisateur authentifié peut créer une transaction, sans vérification de rôle.

**Correction :**
```typescript
@Post()
@Roles(RoleType.AGENT, RoleType.AGENCY_MANAGER, RoleType.NETWORK_ADMIN, RoleType.SUPER_ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
create(@Body() dto: CreateTransactionDto, @Req() req: any) { ... }
```

---

### P1-06 · Périodes de rapports dynamiques

**Gravité :** MAJEUR (bloquant en production — données incorrectes)  
**Fichier :** `apps/web/src/app/(dashboard)/dashboard/rapports/page.tsx`  
**Problème :** Les périodes `janvier_2024`, `decembre_2023`, `trimestre_4_2023` sont hardcodées — inutilisables à partir de 2025.

**Correction :**
```typescript
// Remplacer le tableau PERIODES statique par :
function genererPeriodes(nbMois = 12) {
  const periodes = [];
  const now = new Date();
  for (let i = 0; i < nbMois; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    periodes.push({ value, label });
  }
  return periodes;
}
const PERIODES = genererPeriodes();
```

---

### P1-07 · Connecter le formulaire Paramètres à l'API

**Gravité :** MAJEUR (fonctionnalité cassée)  
**Fichier :** `apps/web/src/app/(dashboard)/dashboard/settings/page.tsx`  
**Problème :** Les modifications du profil et du mot de passe ne sont pas sauvegardées.

**Correction :**
1. Créer `hooks/useUpdateProfile.ts` avec `useMutation` vers `PATCH /api/users/:id`
2. Créer `hooks/useChangePassword.ts` vers `POST /api/auth/change-password`
3. Connecter les `onSubmit` des formulaires `OngletProfil` et `OngletSecurite`

---

## PHASE P2 — CORRECTIONS IMPORTANTES

> À traiter dans le sprint suivant. Impactent la qualité et la complétude des fonctionnalités.

---

### P2-01 · Ajouter pages de détail (Agent, Agence, Client)

**Fichiers à créer :**
- `apps/web/src/app/(dashboard)/dashboard/agents/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/dashboard/agences/[id]/page.tsx`
- `apps/web/src/app/(dashboard)/dashboard/clients/[id]/page.tsx`

**Contenu minimal :** informations détaillées, historique de transactions, statut, actions (modifier, suspendre).

---

### P2-02 · Créer hook dédié pour le Support (Tickets)

**Fichier :** `apps/web/src/hooks/useTickets.ts`  
**Problème :** `support/page.tsx` fait des appels directs avec `api` sans TanStack Query.  

**Correction :** Créer `useTickets()`, `useCreateTicket()`, `useTicketMessages()` avec TanStack Query et types partagés depuis `@/types`.

---

### P2-03 · Connecter le bouton "Actualiser" Transactions

**Fichier :** `apps/web/src/app/(dashboard)/dashboard/transactions/page.tsx` (ligne ~218)  
**Correction :**
```typescript
// Ajouter refetch depuis useTransactions :
const { data, isLoading, refetch } = useTransactions({ ... });
// Puis sur le bouton :
<Button onClick={() => refetch()}>Actualiser</Button>
```

---

### P2-04 · Ajouter navigation "Voir" sur les agents

**Fichier :** `apps/web/src/app/(dashboard)/dashboard/agents/page.tsx` (ligne ~153)  
**Correction :**
```typescript
<button onClick={() => router.push(`/dashboard/agents/${ligne.id}`)}>Voir</button>
```

---

### P2-05 · Harmoniser les rôles (enum API vs CDC)

**Fichier :** `apps/api/src/common/enums/role.enum.ts`  
**Problème :** Le rôle `CAISSIER` du CDC n'existe pas dans l'enum. `NETWORK_ADMIN` et `AGENCY_MANAGER` ne correspondent pas aux noms CDC.  

**Correction :** Choisir entre :
- A) Ajouter `CASHIER = 'CASHIER'` à l'enum (niveau hiérarchique 25)
- B) Renommer pour aligner CDC : `ADMIN`, `MANAGER`, `CAISSIER`
- C) Documenter la correspondance (option minimale)

---

### P2-06 · Filtrage par date sur les Transactions

**Fichier :** `apps/web/src/app/(dashboard)/dashboard/transactions/page.tsx`  
**Problème :** Pas de filtre date malgré des champs `dateDebut`/`dateFin` dans les DTOs API.  

**Correction :** Ajouter deux `<Input type="date">` dans les filtres avancés et les passer à `useTransactions()`.

---

### P2-07 · Exporter Float, Caisse, Performances

**Fichiers :** `float/page.tsx`, `caisse/page.tsx`, `performances/page.tsx`  
**Correction :** Ajouter bouton export CSV/Excel utilisant `exporterCsv` existant sur les données déjà récupérées.

---

### P2-08 · Supprimer les routes doublons

**Fichiers :**
- `apps/web/src/app/(dashboard)/dashboard/customers/page.tsx` → supprimer (doublon de `/clients`)
- `apps/web/src/app/(dashboard)/dashboard/reporting/page.tsx` → supprimer (doublon de `/rapports`)

Si des liens externes pointent vers ces URLs, configurer des redirects 301 dans `next.config.js`.

---

### P2-09 · Contenu du guide depuis l'API ou CMS

**Fichier :** `apps/web/src/app/(dashboard)/dashboard/aide/page.tsx`  
**Problème :** Contenu hardcodé — impossible à mettre à jour sans déploiement.  

**Correction :** Créer un endpoint `GET /api/config-app/guide` retournant les articles, ou utiliser les `PageLegale` Prisma existants.

---

### P2-10 · Ajouter filtre de date sur les Rapports

**Fichier :** `apps/web/src/app/(dashboard)/dashboard/rapports/page.tsx`  
**Correction :** En plus des périodes dynamiques (P1-06), ajouter des sélecteurs `dateDebut`/`dateFin` pour des rapports personnalisés.

---

### P2-11 · Créer module frontend Comptabilité (minimum viable)

**Fichier à créer :** `apps/web/src/app/(dashboard)/dashboard/comptabilite/page.tsx`  
**Contenu minimal :** Grand livre, journaux, exercices fiscaux — lecture seule pour commencer.

---

### P2-12 · Tests unitaires frontend

**Problème :** Aucun test Jest/Vitest détecté pour le frontend.  
**Correction :** Ajouter au moins des tests pour :
- `formatMontant()`, `formatDate()` (lib/formatters)
- Composants `Button`, `Modal`, `Table`
- Hooks `useTransactions`, `useAgents`

---

## PHASE P3 — AMÉLIORATIONS ET QUALITÉ

> À traiter selon la disponibilité. Impact faible sur les fonctionnalités mais améliore la qualité globale.

---

### P3-01 · Corriger les typos et labels

| Fichier | Correction |
|---------|-----------|
| `agents/page.tsx` | "telephone" → "Téléphone" |
| `commissions/page.tsx` | "calculee" → "Calculée", "validee" → "Validée", "payee" → "Payée" |
| `agents/page.tsx` | Ajout accent "Inscriptions" |

---

### P3-02 · Corriger les dépendances ESLint react-hooks

**Fichiers :** `dashboard/page.tsx`, autres avec `// eslint-disable-line react-hooks/exhaustive-deps`  
**Correction :** Ajouter les dépendances manquantes dans les tableaux de dépendances `useEffect`.

---

### P3-03 · Action "Exporter" vide sur le Dashboard principal

**Fichier :** `apps/web/src/app/(dashboard)/dashboard/page.tsx` (onClick vide)  
**Correction :** Connecter à `exporterPdf` du rapport du jour ou supprimer le bouton.

---

### P3-04 · Pagination côté serveur pour Agents et Agences

**Problème actuel :** Agents et Agences chargent toutes les données puis paginent côté client — non scalable.  
**Correction :** Passer des paramètres `page`/`limit` aux hooks comme `useTransactions` le fait déjà.

---

### P3-05 · Composant `<RequireRole>` frontend

**Créer :** `apps/web/src/components/auth/RequireRole.tsx`
```typescript
export function RequireRole({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!roles.includes(user?.role ?? '')) return null;
  return <>{children}</>;
}
```
Utiliser pour masquer les boutons de création/suppression selon le rôle.

---

### P3-06 · Internationalisation des pages partielles (EN)

**Fichiers :** `support/page.tsx`, `aide/page.tsx`, `caisse/page.tsx`  
**Problème :** Chaînes de texte en dur en français.  
**Correction :** Extraire dans `lib/i18n.ts` pour les rendre traductibles.

---

### P3-07 · Overflow des tables sur mobile

**Problème :** Les tables `Table` sur mobile peuvent provoquer un scroll horizontal de la page.  
**Correction :** Envelopper les `<Table>` dans `<div className="overflow-x-auto">`.

---

### P3-08 · Ajouter tests E2E (Playwright)

**Flux critiques à couvrir :**
1. Login → Dashboard → Créer une transaction → Valider
2. Login SuperAdmin → Dashboard SA → Voir tenants
3. Logout → Vérifier redirection /login

---

### P3-09 · Ajouter logs d'audit sur les actions sensibles (frontend)

**Problème :** `AuditLog` existe dans Prisma et le module `audit` dans NestJS, mais aucun appel frontend détecté.  
**Correction :** Appeler `POST /api/audit` après création/modification/suppression critique.

---

### P3-10 · Nettoyage du superadmin dashboard — retirer les commentaires MOCK

**Fichier :** `superadmin/page.tsx`  
**Correction :** Après P1-01 (connexion API), supprimer les commentaires et variables MOCK résiduels.

---

## TABLEAU DE BORD DU PLAN

| ID | Priorité | Effort | Impact | Statut |
|----|----------|--------|--------|--------|
| P1-01 | P1 | M (3j) | CRITIQUE | TODO |
| P1-02 | P1 | XS (2h) | CRITIQUE | TODO |
| P1-03 | P1 | S (1j) | CRITIQUE | TODO |
| P1-04 | P1 | M (2j) | CRITIQUE | TODO |
| P1-05 | P1 | XS (2h) | CRITIQUE | TODO |
| P1-06 | P1 | XS (2h) | MAJEUR | TODO |
| P1-07 | P1 | S (1j) | MAJEUR | TODO |
| P2-01 | P2 | L (5j) | MAJEUR | TODO |
| P2-02 | P2 | S (1j) | MAJEUR | TODO |
| P2-03 | P2 | XS (1h) | MINEUR | TODO |
| P2-04 | P2 | XS (1h) | MINEUR | TODO |
| P2-05 | P2 | S (1j) | MAJEUR | TODO |
| P2-06 | P2 | S (1j) | MAJEUR | TODO |
| P2-07 | P2 | S (1j) | MINEUR | TODO |
| P2-08 | P2 | XS (2h) | MINEUR | TODO |
| P2-09 | P2 | M (3j) | MAJEUR | TODO |
| P2-10 | P2 | S (1j) | MAJEUR | TODO |
| P2-11 | P2 | XL (8j) | MAJEUR | TODO |
| P2-12 | P2 | L (5j) | MAJEUR | TODO |
| P3-01 | P3 | XS (2h) | MINEUR | TODO |
| P3-02 | P3 | XS (2h) | MINEUR | TODO |
| P3-03 | P3 | XS (1h) | MINEUR | TODO |
| P3-04 | P3 | M (3j) | MINEUR | TODO |
| P3-05 | P3 | S (1j) | MOYEN | TODO |
| P3-06 | P3 | M (3j) | MOYEN | TODO |
| P3-07 | P3 | XS (2h) | MINEUR | TODO |
| P3-08 | P3 | L (5j) | MOYEN | TODO |
| P3-09 | P3 | M (3j) | MOYEN | TODO |
| P3-10 | P3 | XS (1h) | MINEUR | TODO |

**Effort total estimé P1 :** ~10 jours développeur  
**Effort total estimé P2 :** ~28 jours développeur  
**Effort total estimé P3 :** ~18 jours développeur
