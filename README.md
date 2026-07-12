# GESTMONEY

**Plateforme Cloud SaaS africaine de gestion des reseaux Mobile Money**

Developpe par **IBIG SOFT**

---

## Presentation

GESTMONEY est une solution de gestion complete pour les operateurs, agences, super-agents et agents de Mobile Money en Afrique. La plateforme couvre l ensemble du cycle de vie des transactions et offre des outils avances de pilotage et de conformite.

### Operateurs supportes

- Orange Money (Cote d Ivoire, Senegal, Mali, Burkina Faso...)
- MTN MoMo (Cote d Ivoire, Ghana, Cameroun...)
- Wave (Cote d Ivoire, Senegal, Mali...)
- Moov Money (Cote d Ivoire, Benin, Togo...)
- Free Money (Senegal)
- Airtel Money, M-PESA (Afrique de l Est)

### Fonctionnalites principales

| Module | Description |
|--------|-------------|
| Transactions | Depot, retrait, transfert, paiements avec suivi en temps reel |
| Gestion du Float | Suivi de la liquidite par agent/agence avec alertes automatiques |
| Commissions | Calcul automatique et paiement des commissions par palier |
| Clients & Fidelite | Base clients KYC, programme de points fidelite |
| Comptabilite | Plan comptable, journaux, grand livre, bilan automatise |
| Gestion des caisses | Ouverture/cloture de caisse, coffre d agence |
| Inventaire | Gestion des stocks et produits (SIM, recharges...) |
| RH & Paie | Employes, contrats, fiches de paie, conges |
| Fraude & IA | Detection de fraude par ML, alertes en temps reel |
| Multi-tenant | Isolation complete des donnees par reseau/client |

---

## Stack Technique

### Backend
- **NestJS 10** - Framework Node.js
- **Prisma 5** - ORM TypeScript
- **PostgreSQL 16** - Base de donnees principale
- **Redis 7** - Cache et queues (BullMQ)
- **Elasticsearch 8** - Recherche et analytique

### Frontend
- **Next.js 14** - App Router, React Server Components
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **TanStack Query** - Data fetching
- **React Hook Form + Zod** - Formulaires et validation

### Mobile
- **React Native + Expo** - Application mobile iOS/Android

### Infrastructure
- **Docker + Docker Compose** - Containerisation
- **Turborepo** - Monorepo build system
- **pnpm Workspaces** - Gestion des packages

---

## Structure du Projet

```
GESTMONEY/
├── apps/
│   ├── web/          # Frontend Next.js 14  (port 3000)
│   ├── mobile/       # React Native / Expo
│   └── api/          # Backend NestJS        (port 3001)
├── packages/
│   ├── shared/       # Types et utilitaires partages
│   ├── ui/           # Composants React reutilisables
│   └── database/     # Schema Prisma + migrations
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── Dockerfile.api
│   └── Dockerfile.web
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## Demarrage Rapide

### Prerequis

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose

### Installation

```bash
# 1. Cloner le depot
git clone https://github.com/ibig-soft/gestmoney.git
cd gestmoney

# 2. Copier les variables d environnement
cp .env.example .env
# Editer .env avec vos valeurs

# 3. Installer les dependances
pnpm install

# 4. Demarrer les services Docker (PostgreSQL, Redis, Elasticsearch)
pnpm docker:dev

# 5. Generer le client Prisma et migrer la base de donnees
pnpm db:generate
pnpm db:push

# 6. Lancer tous les services en mode developpement
pnpm dev
```

### Acces aux services

| Service | URL |
|---------|-----|
| Frontend (Next.js) | http://localhost:3000 |
| API (NestJS) | http://localhost:3001/api/v1 |
| Swagger Docs | http://localhost:3001/api/docs |
| Adminer (DB) | http://localhost:8080 |
| Redis Commander | http://localhost:8081 |
| MailHog | http://localhost:8025 |
| MinIO Console | http://localhost:9001 |

---

## Commandes Disponibles

```bash
# Developpement
pnpm dev              # Demarre tous les apps en mode watch
pnpm build            # Build de production
pnpm test             # Lance les tests
pnpm lint             # Lint du code
pnpm type-check       # Verification TypeScript

# Base de donnees
pnpm db:generate      # Genere le client Prisma
pnpm db:push          # Push le schema vers la BD (dev)
pnpm db:migrate       # Cree une migration
pnpm db:studio        # Ouvre Prisma Studio

# Docker
pnpm docker:up        # Demarre les containers
pnpm docker:down      # Arrete les containers
pnpm docker:dev       # Mode developpement avec outils additionnels
```

---

## Variables d Environnement

Copiez `.env.example` en `.env` et configurez :

- `DATABASE_URL` - URL PostgreSQL
- `REDIS_URL` - URL Redis
- `JWT_SECRET` / `JWT_REFRESH_SECRET` - Secrets JWT (min 32 caracteres)
- `NEXT_PUBLIC_API_URL` - URL de l API pour le frontend
- Credentials des operateurs Mobile Money (Orange, MTN, Wave...)

---

## Architecture Multi-tenant

Chaque client (tenant) dispose de son propre espace isole. Toutes les tables incluent un champ `tenantId` pour l isolation des donnees. Un tenant peut gerer plusieurs reseaux Mobile Money.

---

## Licence

Logiciel proprietaire - IBIG SOFT. Tous droits reserves.

---

## Contact

**IBIG SOFT**
- Site : https://www.ibig-soft.com
- Email : contact@ibig-soft.com
