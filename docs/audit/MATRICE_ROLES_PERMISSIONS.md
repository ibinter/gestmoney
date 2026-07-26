# MATRICE RÔLES & PERMISSIONS — GESTMONEY

> Généré le 2026-07-26 | Source : apps/api/src/**/*.controller.ts + packages/database/schema.prisma

## Rôles système (RoleType enum)

| Rôle | Description |
|---|---|
| `SUPER_ADMIN` | Administrateur de la plateforme GESTMONEY (accès global) |
| `NETWORK_ADMIN` | Administrateur du réseau d'un tenant |
| `AGENCY_MANAGER` | Manager d'agence |
| `AGENT` | Agent de terrain |
| `ACCOUNTANT` | Comptable |
| `AUDITOR` | Auditeur (défini en schéma, non utilisé dans @Roles) |
| `SUPPORT` | Support client |
| `CUSTOMER` | Client final |

---

## Matrice Rôle × Action × Module

Légende : ✅ = autorisé | ❌ = refusé | ⚠️ = guard commenté

### Agents
| Action | SA | NA | AM | AGENT | ACC |
|---|---|---|---|---|---|
| Créer | ✅ | ✅ | ✅ | ❌ | ❌ |
| Lister/Voir | ✅ | ✅ | ✅ | ✅ | ✅ |
| Modifier | ✅ | ✅ | ✅ | ❌ | ❌ |
| Supprimer | ✅ | ✅ | ❌ | ❌ | ❌ |
| Suspendre/Activer | ✅ | ✅ | ✅ | ❌ | ❌ |

### Agences
| Action | SA | NA | AM | AGENT | ACC |
|---|---|---|---|---|---|
| Créer/Modifier/Supprimer | ✅ | ✅ | ❌ | ❌ | ❌ |
| Lister/Voir | ✅ | ✅ | ✅ | ✅ | ✅ |
| Assigner agent | ✅ | ✅ | ✅ | ❌ | ❌ |

### Float
| Action | SA | NA | AM | AGENT | ACC |
|---|---|---|---|---|---|
| Voir comptes | ✅ | ✅ | ✅ | ✅ | ✅ |
| Demander rechargement | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approuver/Rejeter | ✅ | ✅ | ✅ | ❌ | ❌ |
| Définir seuils | ✅ | ✅ | ✅ | ❌ | ❌ |

### Caisse
| Action | SA | NA | AM | AGENT | ACC |
|---|---|---|---|---|---|
| Voir stats/solde | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ouvrir/Fermer/Écriture | ✅ | ✅ | ✅ | ✅ | ❌ |

### Commissions
| Action | SA | NA | AM | AGENT | ACC |
|---|---|---|---|---|---|
| Voir | ✅ | ✅ | ✅ | ✅ | ✅ |
| Calculer / Payer | ✅ | ✅ | ❌ | ❌ | ✅ |
| Créer/Modifier plan | ✅ | ✅ | ❌ | ❌ | ❌ |

### Clients / KYC
| Action | SA | NA | AM | AGENT | ACC |
|---|---|---|---|---|---|
| CRUD client | ✅ | ✅ | ✅ | ✅ | ❌ |
| Soumettre KYC | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approuver/Rejeter KYC | ✅ | ✅ | ❌ | ❌ | ❌ |

### Comptabilité
| Action | SA | NA | AM | AGENT | ACC |
|---|---|---|---|---|---|
| Voir rapports | ✅ | ✅ | ✅ | ❌ | ✅ |
| Créer écriture/plan | ✅ | ✅ | ❌ | ❌ | ✅ |
| Exercice fiscal (créer/clôturer) | ✅ | ✅ | ❌ | ❌ | ❌ |

### RH (⚠️ guards partiellement commentés)
| Action | SA | NA | AM | AGENT | ACC |
|---|---|---|---|---|---|
| CRUD employés | ✅ | ⚠️ | ⚠️ | ❌ | ❌ |
| Générer/Valider paie | ✅ | ⚠️ | ❌ | ❌ | ⚠️ |
| Congés | ✅ | ⚠️ | ⚠️ | ✅ | ❌ |

### Licences
| Action | SA | NA | AM | AGENT | ACC |
|---|---|---|---|---|---|
| Voir son statut | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin licences (essai/renouvellement/plan) | ✅ | ❌ | ❌ | ❌ | ❌ |

### SuperAdmin
| Action | SA | Autres |
|---|---|---|
| Tous les tenants | ✅ | ❌ |
| CRM (prospects/démos/offres) | ✅ | ❌ |
| Ops globales | ✅ | ❌ |

---

## Anomalies détectées

1. **AUDITOR** : rôle défini dans le schéma Prisma mais absent de tous les `@Roles()` dans les contrôleurs.
2. **RH sans guard** : `hr.controller.ts` ligne 153 : `// @Roles('HR_MANAGER', 'ADMIN')` — risque d'accès non autorisé.
3. **Config-App** : mélange de `Role` (enum local) et `RoleType` (enum global) — incohérence à corriger.
4. **Audit logs** : `audit.controller.ts` utilise `@UseGuards(JwtAuthGuard)` sans `RolesGuard` — tout utilisateur connecté peut voir les logs d'audit de son tenant.
