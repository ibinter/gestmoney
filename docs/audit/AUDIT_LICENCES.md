# AUDIT MODULE LICENCES — GESTMONEY

> Généré le 2026-07-26 | Source : apps/api/src/licences/

## Architecture du module

Le module `licences` gère le cycle de vie des abonnements SaaS des tenants. Il s'appuie sur :
- `LicencesService` : logique métier + transitions d'état
- `LicencesScheduler` : tâches cron (rappels d'expiration, vérifications périodiques)
- `LicencesGuard` : intercepteur global vérifiant le statut de licence avant chaque requête
- `@SansLicence` : décorateur pour exempter une route du contrôle de licence
- `licences.events.ts` : constantes d'événements émis via EventEmitter2

## Cycle de vie des licences

```
ESSAI ──────┐
            ▼
      [fin essai]──► EXPIREE ──► REVOQUEE
            │
            ▼
         ACTIVE ──── [fin abonnement] ──► GRACE (période de grâce)
            │                                    │
      [renouvellement]                    [non-renouvellement]
            │                                    │
          ACTIVE                            SUSPENDUE ──► EXPIREE
            │
      [changement plan]
            │
         ACTIVE (nouveau plan)
```

**Statuts métier** (stockés dans `Tenant.settings.licence.statut` JSON) :

| Statut | Description | Accès app |
|---|---|---|
| `ESSAI` | Période d'essai en cours | ✅ Oui |
| `ACTIVE` | Abonnement valide | ✅ Oui |
| `GRACE` | Abonnement expiré, période de grâce active | ✅ Oui |
| `PROVISOIRE` | Licence manuelle temporaire | ✅ Oui |
| `SUSPENDUE` | Suspendue par SA ou non-paiement | ❌ Non |
| `EXPIREE` | Grâce dépassée | ❌ Non |
| `REVOQUEE` | Révocation manuelle | ❌ Non |

**Statuts Prisma** (`TenantStatus`) — source de vérité pour l'autorisation :
`ACTIVE` | `SUSPENDED` | `TRIAL` | `EXPIRED`

> Note : Le statut fin métier est dans le JSON `settings.licence`, le statut grossier (`TenantStatus`) est synchronisé à chaque transition.

## Points de contrôle

| Point | Mécanisme | Fichier |
|---|---|---|
| Chaque requête API | `LicenceGuard` (global) | `licence.guard.ts` |
| Routes exemptées | `@SansLicence()` | routes publiques, auth, health |
| Rappels d'expiration | Cron via `LicencesScheduler` | `licences.scheduler.ts` |
| Transitions d'état | `LicencesService` | `licences.service.ts` |
| Événements (email...) | `EventEmitter2` → `NotificationListener` | `licences.events.ts` |

## Routes du module

| Route | Méthode | Auth | Rôles | Description |
|---|---|---|---|---|
| `/licences/mon-statut` | GET | JWT | Tous | Statut de la licence du tenant courant |
| `/licences/:tenantId/statut` | GET | JWT | SUPER_ADMIN | Statut d'un tenant spécifique |
| `/licences/:tenantId/historique` | GET | JWT | SUPER_ADMIN | Historique des événements licence |
| `/licences/:tenantId/essai` | POST | JWT | SUPER_ADMIN | Démarrer une période d'essai |
| `/licences/:tenantId/renouveler` | POST | JWT | SUPER_ADMIN | Renouveler l'abonnement |
| `/licences/:tenantId/plan` | POST | JWT | SUPER_ADMIN | Changer le plan |

## Risques identifiés

| Risque | Gravité | Note |
|---|---|---|
| **Statut JSON non synchronisé** | Moyenne | Si le cron échoue, le statut JSON peut dériver du `TenantStatus` Prisma |
| **Essai rejouable en DB** | Faible | `essaiConsomme` dans JSON — si settings réinitialisé, essai rejouable |
| **Rappels d'expiration sans queue** | Moyenne | Les rappels sont envoyés via EventEmitter en mémoire — une redémarrage perd les rappels en cours |
| **Pas de webhook de paiement réel** | Haute | `payments/webhooks.controller.ts` existe mais l'intégration Stripe/PayDunya reste à câbler en production |
