# GESTMONEY — Architecture Technique

## Vue d'ensemble

GESTMONEY est une plateforme Cloud SaaS multi-tenant construite en monorepo
(pnpm workspaces + Turborepo). Elle couvre la gestion complète des réseaux
Mobile Money africains : transactions, float, commissions, comptabilité et RH.

---

## Diagramme d'architecture

```
                          ┌─────────────────────────────────────────┐
                          │              INTERNET / CLIENTS          │
                          └────────────────────┬────────────────────┘
                                               │ HTTPS
                          ┌────────────────────▼────────────────────┐
                          │          NGINX (Reverse Proxy)           │
                          │    TLS termination · Rate limiting       │
                          │    Load balancing · Static assets        │
                          └───┬────────────────┬────────────────┬───┘
                              │                │                │
               ┌──────────────▼──┐    ┌────────▼──────┐  ┌─────▼──────────┐
               │   Next.js Web   │    │  NestJS API   │  │  AI Service    │
               │   (apps/web)    │    │  (apps/api)   │  │ (apps/ai-svc)  │
               │   Port 3000     │    │  Port 3001    │  │  Port 8000     │
               │   SSR · PWA     │    │  REST · WS    │  │  FastAPI       │
               └────────────────-┘    └───────┬───────┘  └─────┬──────────┘
                                              │                  │
                          ┌───────────────────▼──────────────────▼───┐
                          │              MESSAGE BUS (Bull/Redis)      │
                          │  Queues: transactions · notifications ·   │
                          │          commissions · reports · fraud    │
                          └────────────────────┬──────────────────────┘
                                               │
               ┌───────────────────────────────▼────────────────────────┐
               │                   COUCHE DE DONNÉES                    │
               │                                                         │
               │  ┌──────────────┐  ┌──────────┐  ┌──────────────────┐ │
               │  │  PostgreSQL  │  │  Redis   │  │   MinIO / S3     │ │
               │  │  (Prisma)    │  │  Cache   │  │   Documents      │ │
               │  │  Multi-      │  │  Sessions│  │   Rapports PDF   │ │
               │  │  tenant      │  │  Queues  │  │   Justificatifs  │ │
               │  └──────────────┘  └──────────┘  └──────────────────┘ │
               └─────────────────────────────────────────────────────────┘
                                               │
               ┌───────────────────────────────▼────────────────────────┐
               │              OPÉRATEURS MOBILE MONEY                   │
               │   Orange Money CI · MTN CI · Wave · Moov · Airtel     │
               │              (APIs partenaires via HTTPS)              │
               └─────────────────────────────────────────────────────────┘
```

---

## Structure du monorepo

```
gestmoney/
├── apps/
│   ├── web/               # Frontend Next.js 14 (App Router)
│   │   ├── src/app/       # Pages et layouts
│   │   ├── src/components/# Composants réutilisables
│   │   ├── src/hooks/     # Hooks React personnalisés
│   │   └── src/store/     # État global (Zustand)
│   │
│   ├── api/               # Backend NestJS 10
│   │   └── src/
│   │       ├── auth/      # Authentification JWT + 2FA
│   │       ├── transactions/ # Module transactions
│   │       ├── float/     # Gestion du float
│   │       ├── commissions/  # Calcul des commissions
│   │       ├── accounting/ # Comptabilité SYSCOHADA
│   │       ├── users/     # Gestion utilisateurs
│   │       └── common/    # Guards, pipes, decorators
│   │
│   └── ai-service/        # Microservice IA (Python/FastAPI)
│       ├── fraud_detection/ # Détection fraude ML
│       ├── forecasting/   # Prévisions float
│       └── reporting/     # Génération rapports IA
│
├── packages/
│   ├── database/          # Prisma schema + migrations + seeds
│   │   ├── schema.prisma  # Schéma PostgreSQL complet
│   │   └── src/seeds/     # Données de démonstration
│   │
│   └── shared/            # Types et utilitaires partagés
│       └── src/
│           ├── types/     # Types TypeScript communs
│           ├── constants/ # Constantes (opérateurs, devises)
│           └── utils/     # Fonctions utilitaires
│
├── docker/                # Configuration Docker
└── .github/               # CI/CD GitHub Actions
```

---

## Flux de données — Transaction Mobile Money

```
Agent (Mobile/Web)
      │
      │ POST /transactions
      ▼
[NestJS API — TransactionsController]
      │
      ├── [JwtAuthGuard] — Vérifie le token JWT
      ├── [RolesGuard]   — Vérifie le rôle AGENT
      ├── [TenantGuard]  — Isole par tenant (multi-tenant)
      ├── [ValidationPipe] — Valide le DTO
      │
      ▼
[TransactionsService]
      │
      ├── Vérifie le float disponible (FloatService)
      ├── Vérifie les limites journalières/mensuelles
      ├── Appelle l'API de l'opérateur (via circuit breaker)
      │
      ├── [Si succès opérateur]
      │       ├── Crée la transaction en DB (Prisma)
      │       ├── Débite le float (FloatService)
      │       ├── Émet l'événement TRANSACTION_COMPLETED
      │       └── Retourne la réponse 201
      │
      └── [Si échec opérateur]
              ├── Marque la transaction FAILED
              ├── Émet l'événement TRANSACTION_FAILED
              └── Retourne l'erreur 422
                    │
Events: ────────────▼─────────────────────────────────────────────
      │
      ├── [CommissionListener]   → Calcule et enregistre la commission
      ├── [AccountingListener]   → Génère l'écriture SYSCOHADA
      ├── [FraudListener]        → Analyse de fraude (ML)
      ├── [NotificationListener] → SMS/Push/Email agent + client
      └── [AuditListener]        → Log d'audit immuable
```

---

## Architecture Multi-tenant

Chaque requête est isolée par `tenantId` :

```
Request Headers:
  Authorization: Bearer <jwt>     → userId + tenantId dans le payload
  X-Tenant-ID: ibig-demo          → slug du tenant (optionnel, lu du JWT)

Toutes les requêtes Prisma filtrent :
  WHERE "tenantId" = $tenantId

Les données d'un tenant ne sont jamais accessibles depuis un autre.
```

---

## Service IA (FastAPI Python)

```
apps/ai-service/
├── fraud_detection/
│   ├── model.py          # Modèle ML (Isolation Forest + règles métier)
│   ├── features.py       # Feature engineering sur transactions
│   └── alerts.py         # Génération des alertes fraude
│
├── forecasting/
│   ├── float_predictor.py  # Prévision des besoins en float (LSTM)
│   └── demand_model.py     # Modèle de demande par agence/opérateur
│
└── reporting/
    ├── pdf_generator.py   # Génération rapports PDF
    └── insights.py        # KPIs et insights automatiques
```

Communication avec l'API NestJS :
- Appels REST internes (réseau Docker)
- Authentification par clé API interne (`AI_SERVICE_API_KEY`)
- Événements asynchrones via Redis Pub/Sub

---

## Sécurité

| Couche | Mécanisme |
|--------|-----------|
| Transport | TLS 1.3 (Let's Encrypt) |
| Auth API | JWT RS256 (access 15min + refresh 7j) |
| 2FA | TOTP (Google Authenticator compatible) |
| Multi-tenant | Row-level isolation via `tenantId` |
| Mots de passe | bcrypt (12 rounds) |
| Logs | Audit log immuable avec signature |
| Images Docker | Trivy scan (CI + hebdomadaire) |
| Code | CodeQL analysis (CI) |
| Dépendances | npm audit + Safety (Python) hebdomadaire |
| Réseau | VPC privé, seul Nginx exposé sur Internet |

---

## Technologies

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | Next.js (App Router) | 14 |
| UI | Tailwind CSS + shadcn/ui | — |
| State | Zustand | 4 |
| Backend | NestJS | 10 |
| ORM | Prisma | 5 |
| Base de données | PostgreSQL | 16 |
| Cache / Queues | Redis (Bull) | 7 |
| IA | FastAPI + scikit-learn + PyTorch | — |
| Monorepo | pnpm workspaces + Turborepo | — |
| CI/CD | GitHub Actions | — |
| Conteneurs | Docker + Docker Compose | — |
| Reverse Proxy | Nginx | 1.25 |
| Monitoring | Prometheus + Grafana | — |
| Logs | Loki + Grafana | — |
| Erreurs | Sentry | — |
