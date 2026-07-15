# MATRICE RÔLES & PERMISSIONS — GESTMONEY
> Date : 2026-07-15  
> Sources : `apps/api/src/common/enums/role.enum.ts`, `packages/database/schema.prisma`

---

## 1. RÔLES DÉTECTÉS

### Rôles dans le code API (`role.enum.ts`)

| Enum code | Niveau hiérarchique | Description fonctionnelle |
|-----------|--------------------|--------------------------| 
| `SUPER_ADMIN` | 100 | Administrateur global IBIG Soft — accès total |
| `NETWORK_ADMIN` | 80 | Administrateur réseau/opérateur Mobile Money |
| `AGENCY_MANAGER` | 60 | Responsable d'agence |
| `ACCOUNTANT` | 40 | Comptable |
| `AUDITOR` | 30 | Auditeur (lecture seule) |
| `AGENT` | 20 | Agent Mobile Money |
| `VIEWER` | 10 | Visualisation uniquement |

### Rôles dans le middleware frontend (`middleware.ts`)

Seul `SUPER_ADMIN` est vérifié explicitement :
```typescript
const role = payload.role || payload.roles?.[0];
if (role !== 'SUPER_ADMIN') {
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

### ANOMALIE : Désalignement des rôles

Le CDC mentionne : `SUPER_ADMIN, ADMIN, MANAGER, AGENT, CAISSIER, AUDITEUR`  
L'enum API contient : `SUPER_ADMIN, NETWORK_ADMIN, AGENCY_MANAGER, ACCOUNTANT, AUDITOR, AGENT, VIEWER`

**Correspondances supposées :**

| CDC | API enum | Prisma (dynamique) |
|-----|----------|--------------------|
| SUPER_ADMIN | SUPER_ADMIN | Rôle système Prisma |
| ADMIN | NETWORK_ADMIN | Rôle Prisma par tenant |
| MANAGER | AGENCY_MANAGER | Rôle Prisma par tenant |
| CAISSIER | ❌ Manquant dans l'enum | Rôle Prisma par tenant |
| AUDITEUR | AUDITOR | Rôle Prisma par tenant |
| — | ACCOUNTANT | Rôle Prisma par tenant |
| — | VIEWER | Rôle Prisma par tenant |
| AGENT | AGENT | Rôle Prisma par tenant |

**Note :** Le schéma Prisma implémente un système de rôles dynamiques (`Role`, `Permission`, `RolePermission`) — les rôles réels en base sont configurables par tenant. L'enum code est utilisé pour les guards NestJS.

---

## 2. MATRICE PERMISSIONS PAR MODULE

Légende : ✅ Autorisé | ❌ Interdit | ⚠️ Partiel/conditionnel | ? Non défini dans le code

### MODULE TRANSACTIONS

| Action | SUPER_ADMIN | NETWORK_ADMIN | AGENCY_MANAGER | ACCOUNTANT | AUDITOR | AGENT | VIEWER |
|--------|-------------|--------------|----------------|-----------|---------|-------|--------|
| Voir liste | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (ses tx) | ✅ |
| Créer (dépôt) | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Créer (retrait) | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Créer (cash_in/out) | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Valider | ✅ | ✅ | ✅ | ❌ | ❌ | ⚠️ ses tx | ❌ |
| Annuler/Reversal | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| Exporter | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Guard API actuel** | JwtAuthGuard | JwtAuthGuard | JwtAuthGuard | JwtAuthGuard | JwtAuthGuard | JwtAuthGuard | JwtAuthGuard |
| **Remarque** | Pas de guard rôle sur l'API transactions — tout user authentifié peut créer | | | | | | |

### MODULE AGENTS

| Action | SUPER_ADMIN | NETWORK_ADMIN | AGENCY_MANAGER | ACCOUNTANT | AUDITOR | AGENT | VIEWER |
|--------|-------------|--------------|----------------|-----------|---------|-------|--------|
| Voir liste | ✅ | ✅ | ✅ (son agence) | ❌ | ✅ | ❌ | ✅ |
| Créer | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modifier | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Suspendre/Activer | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Supprimer | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Exporter | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |

### MODULE AGENCES

| Action | SUPER_ADMIN | NETWORK_ADMIN | AGENCY_MANAGER | ACCOUNTANT | AUDITOR | AGENT | VIEWER |
|--------|-------------|--------------|----------------|-----------|---------|-------|--------|
| Voir liste | ✅ | ✅ | ✅ (son agence) | ✅ | ✅ | ✅ (son agence) | ✅ |
| Créer | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Modifier | ✅ | ✅ | ⚠️ (son agence) | ❌ | ❌ | ❌ | ❌ |
| Suspendre/Activer | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Supprimer | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Exporter | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

### MODULE FLOAT

| Action | SUPER_ADMIN | NETWORK_ADMIN | AGENCY_MANAGER | ACCOUNTANT | AUDITOR | AGENT | VIEWER |
|--------|-------------|--------------|----------------|-----------|---------|-------|--------|
| Voir soldes | ✅ | ✅ | ✅ (son agence) | ✅ | ✅ | ✅ (son compte) | ✅ |
| Voir mouvements | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| Demander réappro | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Approuver réappro | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configurer seuils | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### MODULE COMMISSIONS

| Action | SUPER_ADMIN | NETWORK_ADMIN | AGENCY_MANAGER | ACCOUNTANT | AUDITOR | AGENT | VIEWER |
|--------|-------------|--------------|----------------|-----------|---------|-------|--------|
| Voir liste | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (ses comm.) | ❌ |
| Valider | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Payer | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Configurer plans | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Exporter | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ |

### MODULE CLIENTS

| Action | SUPER_ADMIN | NETWORK_ADMIN | AGENCY_MANAGER | ACCOUNTANT | AUDITOR | AGENT | VIEWER |
|--------|-------------|--------------|----------------|-----------|---------|-------|--------|
| Voir liste | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ (ses clients) | ✅ |
| Créer | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Modifier | ✅ | ✅ | ✅ | ❌ | ❌ | ⚠️ | ❌ |
| Bloquer/Débloquer | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Voir historique tx | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| Vérifier KYC | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Exporter | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

### MODULE RAPPORTS

| Action | SUPER_ADMIN | NETWORK_ADMIN | AGENCY_MANAGER | ACCOUNTANT | AUDITOR | AGENT | VIEWER |
|--------|-------------|--------------|----------------|-----------|---------|-------|--------|
| Voir rapports | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Générer rapport | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Exporter PDF | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Exporter XLSX | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Planifier rapport | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

### MODULE CAISSE

| Action | SUPER_ADMIN | NETWORK_ADMIN | AGENCY_MANAGER | ACCOUNTANT | AUDITOR | AGENT | VIEWER |
|--------|-------------|--------------|----------------|-----------|---------|-------|--------|
| Voir journal | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| Ajouter écriture | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ | ❌ |
| Ouvrir/Fermer caisse | ✅ | ✅ | ✅ | ❌ | ❌ | ⚠️ | ❌ |
| Opérations coffre | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### MODULE PARAMÈTRES

| Action | SUPER_ADMIN | NETWORK_ADMIN | AGENCY_MANAGER | ACCOUNTANT | AUDITOR | AGENT | VIEWER |
|--------|-------------|--------------|----------------|-----------|---------|-------|--------|
| Voir son profil | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Modifier son profil | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Changer mot de passe | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gérer 2FA | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Préférences notif. | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Config tenant | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### MODULE SUPERADMIN (IBIG Soft — SUPER_ADMIN uniquement)

| Action | SUPER_ADMIN | Autres rôles |
|--------|-------------|-------------|
| Dashboard global | ✅ | ❌ (middleware redirect) |
| Gestion tenants | ✅ | ❌ |
| Gestion licences | ✅ | ❌ |
| Gestion prospects CRM | ✅ | ❌ |
| Gestion démonstrations | ✅ | ❌ |
| Configuration SARA | ✅ | ❌ |
| Analytics globaux | ✅ | ❌ |
| Gestion emails auto | ✅ | ❌ |
| Gestion paiements SaaS | ✅ | ❌ |

---

## 3. IMPLÉMENTATION DES GUARDS API

### État actuel des guards NestJS

| Contrôleur | Guard présent | Type | Vérification rôle |
|-----------|--------------|------|-------------------|
| `TransactionsController` | ✅ `JwtAuthGuard` | Méthode/Classe | ❌ Aucune vérification de rôle |
| `AgentsController` | À vérifier | — | À vérifier |
| `AgenciesController` | À vérifier | — | À vérifier |
| `CommissionsController` | À vérifier | — | À vérifier |
| `CustomersController` | À vérifier | — | À vérifier |
| `FloatController` (supposé) | À vérifier | — | À vérifier |
| `ReportingController` | À vérifier | — | À vérifier |
| `AuditController` | À vérifier | — | À vérifier |

**Anomalie critique :** `TransactionsController` utilise uniquement `JwtAuthGuard` — pas de `RolesGuard`. Tout utilisateur authentifié peut créer une transaction, quelle que soit son rôle.

### Guards disponibles mais non utilisés sur transactions

```typescript
// apps/api/src/common/guards/roles.guard.ts → existe
// apps/api/src/common/decorators/roles.decorator.ts → existe
// Mais non appliqués sur TransactionsController
```

---

## 4. RECOMMANDATIONS PERMISSIONS

1. **Appliquer `RolesGuard` sur tous les contrôleurs sensibles** (transactions, float, commissions, agents)
2. **Ajouter `@Roles(RoleType.AGENT, RoleType.AGENCY_MANAGER)` sur `POST /transactions`**
3. **Harmoniser l'enum `RoleType`** pour inclure `CAISSIER` (CDC) → mapper sur un rôle existant ou créer `CASHIER`
4. **Frontend** : implémenter un composant `<RequireRole role="AGENCY_MANAGER">` pour masquer les actions non autorisées selon le rôle de l'utilisateur connecté
5. **Middleware** : étendre la protection par rôle sur les routes `/dashboard/commissions` (AGENT ne doit pas valider) et `/dashboard/agents` (AGENT ne doit pas créer)
