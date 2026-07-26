# AUDIT BASE DE DONNÉES — GESTMONEY

> Généré le 2026-07-26 | Source : packages/database/schema.prisma (2 240 lignes)

## Configuration

- Provider : **PostgreSQL**
- ORM : **Prisma** avec `fullTextSearch` activé
- Binary targets : `native` + `linux-musl-openssl-3.0.x` (Docker Alpine)

---

## Modèles et enums

### Multi-tenant
| Modèle/Enum | Description |
|---|---|
| `Tenant` | Tenant principal — slug unique, plan, statut, settings JSON |
| `TenantStatus` | ACTIVE, SUSPENDED, TRIAL, EXPIRED |
| `TenantPlan` | STARTER, PROFESSIONAL, ENTERPRISE, CUSTOM |

### Utilisateurs & Auth
| Modèle/Enum | Description |
|---|---|
| `User` | Utilisateur — unique(tenantId, email), 2FA, failedLoginAttempts |
| `UserStatus` | ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION, PASSWORD_RESET |
| `Role` | Rôle dynamique par tenant (isSystem pour rôles système) |
| `Permission` | Ressource + action (unique) |
| `RolePermission` | Table de jointure role-permission |
| `UserRole` | Table de jointure user-role |
| `Session` | Sessions JWT avec refresh token |

### Réseau d'agence
| Modèle/Enum | Description |
|---|---|
| `Network` | Réseau d'opérateur (Orange, MTN…) |
| `NetworkStatus` | ACTIVE, INACTIVE, SUSPENDED |
| `Agency` | Agence / point de vente |
| `AgencyStatus` | ACTIVE, INACTIVE, SUSPENDED, PENDING |
| `SuperAgent` | Super-agent de réseau |
| `Agent` | Agent de terrain |
| `AgentStatus` | ACTIVE, INACTIVE, SUSPENDED, PENDING, BLACKLISTED |
| `Territory` | Zone géographique d'agent |

### Transactions
| Modèle/Enum | Description |
|---|---|
| `Transaction` | Transaction principale — type, montant, commission, frais, QR token |
| `TransactionType` | SEND_MONEY, RECEIVE_MONEY, CASH_IN, CASH_OUT, BILL_PAYMENT, AIRTIME, etc. |
| `TransactionStatus` | PENDING, PROCESSING, COMPLETED, FAILED, REVERSED, CANCELLED |
| `Reversal` | Annulation de transaction |
| `ReversalReason` | FRAUD, ERROR, CUSTOMER_REQUEST, DUPLICATE, TECHNICAL |

### Float
| Modèle/Enum | Description |
|---|---|
| `FloatAccount` | Compte float par agent/réseau |
| `FloatMovement` | Mouvement de float |
| `FloatMovementType` | CREDIT, DEBIT, TRANSFER, ADJUSTMENT |
| `FloatThreshold` | Seuils min/max par compte |
| `ReplenishmentRequest` | Demande de rechargement float |
| `ReplenishmentStatus` | PENDING, APPROVED, REJECTED, COMPLETED |

### Caisse
| Modèle/Enum | Description |
|---|---|
| `Cashier` | Session de caisse (ouverture/clôture) |
| `CashMovement` | Mouvement de caisse |
| `VaultOperation` | Opération coffre |
| `VaultOperationType` | DEPOSIT, WITHDRAWAL, TRANSFER |

### Commissions
| Modèle/Enum | Description |
|---|---|
| `CommissionPlan` | Plan de commission |
| `CommissionBasis` | PERCENTAGE, FIXED, TIERED |
| `CommissionRate` | Taux par type de transaction |
| `CommissionEarning` | Gain calculé par transaction |
| `CommissionPayment` | Paiement de commissions |
| `CommissionPaymentStatus` | PENDING, APPROVED, PAID, CANCELLED |

### Clients
| Modèle/Enum | Description |
|---|---|
| `Customer` | Client final avec KYC |
| `CustomerStatus` | ACTIVE, INACTIVE, BLOCKED, PENDING_KYC |
| `CustomerAccount` | Compte client |
| `LoyaltyPoint` | Points de fidélité |
| `LoyaltyTransactionType` | EARN, REDEEM, EXPIRE, ADJUST |

### Comptabilité
| Modèle/Enum | Description |
|---|---|
| `AccountChart` | Plan comptable |
| `AccountType` | ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE |
| `JournalEntry` | Écriture journal |
| `JournalEntryStatus` | DRAFT, POSTED, CANCELLED |
| `JournalLine` | Ligne d'écriture (débit/crédit) |
| `Ledger` | Grand livre |
| `FiscalYear` | Exercice fiscal |

### Stock
| Modèle/Enum | Description |
|---|---|
| `Product` | Produit |
| `Inventory` | Stock par dépôt |
| `StockMovement` | Mouvement de stock |
| `StockMovementType` | IN, OUT, ADJUSTMENT, TRANSFER |
| `Supplier` | Fournisseur |
| `PurchaseOrder` | Bon de commande |
| `PurchaseOrderLine` | Ligne de commande |
| `PurchaseOrderStatus` | DRAFT, SUBMITTED, APPROVED, RECEIVED, CANCELLED |

### RH
| Modèle/Enum | Description |
|---|---|
| `Employee` | Employé |
| `Contract` | Contrat de travail |
| `Payroll` | Fiche de paie |
| `Leave` | Demande de congé |

### KYC & Compliance
| Modèle/Enum | Description |
|---|---|
| `KycVerification` | Vérification KYC |
| `KycStatus` | PENDING, IN_PROGRESS, APPROVED, REJECTED, EXPIRED |
| `KycLevel` | BASIC, STANDARD, ENHANCED |
| `FraudAlert` | Alerte fraude |
| `MlPrediction` | Prédiction ML |
| `AuditLog` | Journal d'audit |

### Intégrations & Notifications
| Modèle/Enum | Description |
|---|---|
| `IntegrationLog` | Log des appels opérateurs |
| `NotificationLog` | Log des notifications envoyées |
| `ExchangeRate` | Taux de change |
| `ScheduledReport` | Rapport planifié |
| `GeneratedReport` | Rapport généré |

### SuperAdmin CRM
| Modèle/Enum | Description |
|---|---|
| `Prospect` | Prospect commercial |
| `ProspectOrigine` | SOURCE PROSPECT |
| `ProspectPriorite` | BASSE, NORMALE, HAUTE, URGENTE |
| `ProspectStatut` | NOUVEAU, CONTACTE, QUALIFICATION, PROPOSITION, NEGOCIA, GAGNE, PERDU |
| `Demonstration` | Démonstration produit |
| `Offre` | Offre commerciale |

### Licences & Paiements
| Modèle/Enum | Description |
|---|---|
| `LicenceEvent` | Historique événements licence |
| `LicenceEventType` | ESSAI_DEMARRE, RENOUVELE, SUSPENDU, REACTIVE, etc. |
| `Paiement` | Paiement d'abonnement |
| `PaymentProvider` | STRIPE, PAYDUNYA, CINETPAY, ORANGE_MONEY, etc. |
| `PaiementStatut` | EN_ATTENTE, REUSSI, ECHOUE, REMBOURSE |
| `PaymentMethodConfig` | Config provider par tenant |
| `PaymentMethod` | CARD, MOBILE_MONEY, BANK_TRANSFER, etc. |
| `PaymentConfigAudit` | Audit config paiement |
| `PaymentProof` | Preuve de paiement |
| `WebhookEvent` | Événement webhook reçu |
| `Voucher` | Bon de réduction |

### IA & Autres
| Modèle/Enum | Description |
|---|---|
| `SaraConversation` | Conversation avec l'IA SARA |
| `SaraConfig` | Configuration SARA par tenant |
| `PageLegale` | Pages CGU / politique |
| `AnalyticsEvent` | Événement analytics |
| `DocumentVerification` | Vérification doc par QR |
| `EmailTemplate` | Template email |
| `EmailLog` | Log emails |
| `Ticket` | Ticket support |
| `TicketMessage` | Message de ticket |
| `TicketPriorite` | FAIBLE, NORMALE, HAUTE, URGENTE |
| `TicketStatut` | OUVERT, EN_COURS, RESOLU, FERME |

---

## Statistiques

| Indicateur | Valeur |
|---|---|
| Nombre de modèles | ~60 |
| Nombre d'enums | ~45 |
| Lignes totales | 2 240 |
| Index `@@index([tenantId])` | Présents sur tous les modèles principaux |
| Contraintes unique | `@@unique([tenantId, email])` sur User, `@@unique([tenantId, name])` sur Role |
| Cascade delete | `onDelete: Cascade` sur toutes les relations tenant |

---

## Incohérences et champs manquants

| Problème | Modèle | Gravité | Recommandation |
|---|---|---|---|
| `Agent.networkId` et `Agent.agencyId` non nullable mais relations facultatives | Agent | Moyenne | Clarifier si un agent peut être sans agence |
| `FraudAlert` sans `tenantId` direct | FraudAlert | Moyenne | Vérifier l'isolation tenant |
| `MlPrediction` sans index `tenantId` | MlPrediction | Basse | Ajouter `@@index([tenantId])` |
| `AnalyticsEvent` sans `@@map` | AnalyticsEvent | Basse | Convention de nommage SQL |
| `Voucher` sans relation vers `Transaction` | Voucher | Moyenne | Traçabilité utilisation voucher |
