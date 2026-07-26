# INVENTAIRE DES ROUTES — GESTMONEY

> Généré le 2026-07-26 | Source : apps/api/src/**/*.controller.ts + apps/web/src/app/**/page.tsx

## Routes API (NestJS — préfixe `/api/v1`)

### Santé
| Route | Méthode | Auth | Rôles | Module |
|---|---|---|---|---|
| `/health` | GET | Non | — | AppController |

### Auth
| Route | Méthode | Auth | Rôles | Module |
|---|---|---|---|---|
| `/auth/login` | POST | Non | — | auth |
| `/auth/register` | POST | JWT | Connecté | auth |
| `/auth/logout` | POST | JWT | Connecté | auth |
| `/auth/refresh` | POST | Non | — | auth |
| `/auth/forgot-password` | POST | Non | — | auth |
| `/auth/reset-password` | POST | Non | — | auth |
| `/auth/change-password` | POST | JWT | Connecté | auth |
| `/auth/me` | GET | JWT | Connecté | auth |
| `/auth/avatar` | POST | JWT | Connecté | auth |
| `/auth/avatar` | DELETE | JWT | Connecté | auth |
| `/auth/2fa/enable` | POST | JWT | Connecté | auth |
| `/auth/2fa/verify` | POST | JWT | Connecté | auth |

### Agents
| Route | Méthode | Auth | Rôles | Module |
|---|---|---|---|---|
| `/agents` | POST | JWT+Rôles | SUPER_ADMIN, NETWORK_ADMIN, AGENCY_MANAGER | agents |
| `/agents` | GET | JWT+Rôles | Tous authentifiés | agents |
| `/agents/:id` | GET | JWT+Rôles | Tous authentifiés | agents |
| `/agents/:id` | PATCH | JWT+Rôles | SUPER_ADMIN, NETWORK_ADMIN, AGENCY_MANAGER | agents |
| `/agents/:id` | DELETE | JWT+Rôles | SUPER_ADMIN, NETWORK_ADMIN | agents |
| `/agents/:id/transactions` | GET | JWT+Rôles | Tous authentifiés | agents |
| `/agents/:id/commissions` | GET | JWT+Rôles | Tous authentifiés | agents |
| `/agents/:id/float` | GET | JWT+Rôles | Tous authentifiés | agents |
| `/agents/:id/suspend` | POST | JWT+Rôles | SUPER_ADMIN, NETWORK_ADMIN, AGENCY_MANAGER | agents |
| `/agents/:id/activate` | POST | JWT+Rôles | SUPER_ADMIN, NETWORK_ADMIN, AGENCY_MANAGER | agents |

### Agences
| Route | Méthode | Auth | Rôles | Module |
|---|---|---|---|---|
| `/agencies` | POST | JWT+Rôles | SUPER_ADMIN, NETWORK_ADMIN | agencies |
| `/agencies` | GET | JWT+Rôles | Tous authentifiés | agencies |
| `/agencies/:id` | GET | JWT+Rôles | Tous authentifiés | agencies |
| `/agencies/:id` | PATCH | JWT+Rôles | SUPER_ADMIN, NETWORK_ADMIN | agencies |
| `/agencies/:id` | DELETE | JWT+Rôles | SUPER_ADMIN, NETWORK_ADMIN | agencies |
| `/agencies/:id/statistics` | GET | JWT+Rôles | Tous authentifiés | agencies |
| `/agencies/:id/agents/assign` | POST | JWT+Rôles | SUPER_ADMIN, NETWORK_ADMIN, AGENCY_MANAGER | agencies |

### Transactions
| Route | Méthode | Auth | Rôles | Module |
|---|---|---|---|---|
| `/transactions` | GET/POST/PATCH/DELETE | JWT+Rôles | Selon opération | transactions |

### Float
| Route | Méthode | Auth | Rôles | Module |
|---|---|---|---|---|
| `/float` | GET | JWT+Rôles | Tous | float |
| `/float/network/summary` | GET | JWT+Rôles | Tous | float |
| `/float/movements` | GET | JWT+Rôles | Tous | float |
| `/float/alerts` | GET | JWT+Rôles | Tous | float |
| `/float/forecast` | GET | JWT+Rôles | Tous | float |
| `/float/replenish/pending` | GET | JWT+Rôles | Tous | float |
| `/float/replenish` | POST | JWT+Rôles | SA, NA, AM, AGENT | float |
| `/float/replenish/:id/approve` | PATCH | JWT+Rôles | SA, NA, AM | float |
| `/float/replenish/:id/reject` | PATCH | JWT+Rôles | SA, NA, AM | float |
| `/float/thresholds` | POST | JWT+Rôles | SA, NA, AM | float |
| `/float/:agentId` | GET | JWT+Rôles | Tous | float |

### Caisse
| Route | Méthode | Auth | Rôles | Module |
|---|---|---|---|---|
| `/cashier/stats` | GET | JWT+Rôles | Tous | cashier |
| `/cashier/balance` | GET | JWT+Rôles | Tous | cashier |
| `/cashier/ecritures` | GET | JWT+Rôles | Tous | cashier |
| `/cashier/ecritures` | POST | JWT+Rôles | SA, NA, AM, AGENT | cashier |
| `/cashier/open` | POST | JWT+Rôles | SA, NA, AM, AGENT | cashier |
| `/cashier/close` | POST | JWT+Rôles | SA, NA, AM, AGENT | cashier |
| `/cashier/history` | GET | JWT+Rôles | Tous | cashier |

### Commissions
| Route | Méthode | Auth | Rôles | Module |
|---|---|---|---|---|
| `/commissions` | GET | JWT+Rôles | Tous | commissions |
| `/commissions/summary` | GET | JWT+Rôles | Tous | commissions |
| `/commissions/calculate` | POST | JWT+Rôles | SA, NA, ACCOUNTANT | commissions |
| `/commissions/plans` | POST | JWT+Rôles | SA, NA | commissions |
| `/commissions/plans` | GET | JWT+Rôles | Tous | commissions |
| `/commissions/plans/:id` | PATCH | JWT+Rôles | SA, NA | commissions |
| `/commissions/payments` | POST | JWT+Rôles | SA, NA, ACCOUNTANT | commissions |
| `/commissions/payments` | GET | JWT+Rôles | Tous | commissions |
| `/commissions/agents/:agentId` | GET | JWT+Rôles | Tous | commissions |

### Clients
| Route | Méthode | Auth | Rôles | Module |
|---|---|---|---|---|
| `/customers/search` | GET | JWT | Tous | customers |
| `/customers/stats` | GET | JWT | Tous | customers |
| `/customers` | GET | JWT | Tous | customers |
| `/customers` | POST | JWT | Tous | customers |
| `/customers/import` | POST | JWT | Tous | customers |
| `/customers/:id` | GET | JWT | Tous | customers |
| `/customers/:id` | PATCH | JWT | Tous | customers |
| `/customers/:id/kyc/submit` | PATCH | JWT | Tous | customers |
| `/customers/:id/kyc/approve` | PATCH | JWT+Rôles | SA, NA | customers |
| `/customers/:id/kyc/reject` | PATCH | JWT+Rôles | SA, NA | customers |
| `/customers/:id/kyc/document` | GET | JWT | Tous | customers |
| `/customers/:id/transactions` | GET | JWT | Tous | customers |
| `/customers/:id/loyalty` | GET | JWT | Tous | customers |
| `/customers/:id/loyalty/redeem` | POST | JWT | Tous | customers |

### Comptabilité
| Route | Méthode | Auth | Rôles | Module |
|---|---|---|---|---|
| `/accounting/chart` | GET | JWT+Rôles | Tous | accounting |
| `/accounting/chart` | POST | JWT+Rôles | SA, NA, ACCOUNTANT | accounting |
| `/accounting/journal` | POST | JWT+Rôles | SA, NA, ACCOUNTANT | accounting |
| `/accounting/journal` | GET | JWT+Rôles | Tous | accounting |
| `/accounting/journal/:id` | GET | JWT+Rôles | Tous | accounting |
| `/accounting/ledger` | GET | JWT+Rôles | Tous | accounting |
| `/accounting/ledger/:accountNumber` | GET | JWT+Rôles | Tous | accounting |
| `/accounting/trial-balance` | GET | JWT+Rôles | Tous | accounting |
| `/accounting/income-statement` | GET | JWT+Rôles | Tous | accounting |
| `/accounting/balance-sheet` | GET | JWT+Rôles | Tous | accounting |
| `/accounting/cash-flow` | GET | JWT+Rôles | Tous | accounting |
| `/accounting/fiscal-year` | POST | JWT+Rôles | SA, NA | accounting |
| `/accounting/fiscal-year/:id/close` | POST | JWT+Rôles | SA, NA | accounting |
| `/accounting/fiscal-year` | GET | JWT+Rôles | SA, NA, ACCOUNTANT | accounting |
| `/accounting/reconcile` | POST | JWT+Rôles | Tous | accounting |
| `/accounting/reconcile/pending` | GET | JWT+Rôles | Tous | accounting |
| `/accounting/cost-centers` | GET | JWT+Rôles | Tous | accounting |
| `/accounting/auto-entry` | POST | JWT+Rôles | SA, NA, ACCOUNTANT | accounting |

### Autres modules (résumé)
| Préfixe | Méthodes | Auth | Module |
|---|---|---|---|
| `/kyc/*` | GET/POST/PATCH | JWT | kyc |
| `/hr/employees*` | GET/POST/PATCH | JWT | hr |
| `/hr/contracts*` | GET/POST | JWT | hr |
| `/hr/payroll*` | GET/POST | JWT | hr |
| `/hr/leaves*` | GET/POST/PATCH | JWT | hr |
| `/hr/attendance*` | GET/POST | JWT | hr |
| `/audit/logs*` | GET | JWT | audit |
| `/audit/export` | GET | JWT | audit |
| `/audit/security` | GET | JWT | audit |
| `/audit/financial` | GET | JWT | audit |
| `/licences/mon-statut` | GET | JWT+SuperAdmin | licences |
| `/licences/:tenantId/statut` | GET | JWT+SuperAdmin | licences |
| `/licences/:tenantId/renouveler` | POST | JWT+SuperAdmin | licences |
| `/licences/:tenantId/plan` | POST | JWT+SuperAdmin | licences |
| `/reporting/*` | GET | JWT | reporting |
| `/networks/*` | GET/POST/PATCH/DELETE | JWT+Rôles | networks |
| `/notifications/*` | GET | JWT | notifications |
| `/support/*` | GET/POST/PATCH | JWT | support |
| `/users/*` | GET/POST/PATCH/DELETE | JWT+Rôles | users |
| `/tenants/*` | GET/POST/PATCH/DELETE | JWT+SuperAdmin | tenants |
| `/superadmin/crm/*` | GET/POST/PATCH/DELETE | JWT+SuperAdmin | superadmin |
| `/superadmin/ops/*` | GET | JWT+SuperAdmin | superadmin |
| `/ai/chat/public` | POST | Non | ai |
| `/ai/chat` | POST | JWT | ai |
| `/ai/status` | GET | JWT | ai |
| `/public-leads/*` | GET/POST | Non | public-leads |
| `/documents/public/verify/:token` | GET | Non | document-verification |
| `/documents/generate-verification-token` | POST | JWT | document-verification |
| `/config-app/*` | GET/PATCH | JWT (±Rôles) | config-app |
| `/integrations/*` | GET/POST | JWT | integrations |
| `/payments/*` | GET/POST | JWT | payments |
| `/roles/*` | GET/POST/PATCH/DELETE | JWT+Rôles | roles |
| `/stock/*` | GET/POST/PATCH/DELETE | JWT+Rôles | stock |

---

## Pages Web (Next.js App Router)

| Route web | Type | Auth | Description |
|---|---|---|---|
| `/` | Page publique | Non | Landing page GESTMONEY |
| `/login` | Page auth | Non | Formulaire de connexion |
| `/register` | Page auth | Non | Inscription |
| `/verify` | Page publique | Non | Vérification document par QR |
| `/legal` | Page publique | Non | CGU / politique |
| `/guide` | Dashboard | Oui | Guide interactif |
| `/(dashboard)/` | Dashboard | Oui | Tableau de bord principal |
| `/(dashboard)/transactions` | Dashboard | Oui | Liste transactions |
| `/(dashboard)/agents` | Dashboard | Oui | Gestion agents |
| `/(dashboard)/agences` | Dashboard | Oui | Gestion agences |
| `/(dashboard)/clients` | Dashboard | Oui | Gestion clients |
| `/(dashboard)/caisse` | Dashboard | Oui | Caisse |
| `/(dashboard)/float` | Dashboard | Oui | Float management |
| `/(dashboard)/commissions` | Dashboard | Oui | Commissions |
| `/(dashboard)/rapports` | Dashboard | Oui | Rapports & BI |
| `/(dashboard)/comptabilite` | Dashboard | Oui | Comptabilité |
| `/(dashboard)/stock` | Dashboard | Oui | Gestion stock |
| `/(dashboard)/rh` | Dashboard | Oui | Ressources humaines |
| `/(dashboard)/notifications` | Dashboard | Oui | Notifications |
| `/(dashboard)/support` | Dashboard | Oui | Tickets support |
| `/(dashboard)/parametres` | Dashboard | Oui | Paramètres tenant |
| `/(dashboard)/profil` | Dashboard | Oui | Profil utilisateur |
| `/(dashboard)/kyc` | Dashboard | Oui | KYC agents |
| `/(dashboard)/audit` | Dashboard | Oui | Audit & fraude |
| `/(dashboard)/superadmin` | Dashboard | SuperAdmin | Console SuperAdmin |
| `/(dashboard)/abonnement` | Dashboard | Oui | Licence & abonnement |
