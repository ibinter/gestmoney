# GESTMONEY — Gestion des reseaux Mobile Money

Plateforme SaaS multi-tenant editee par **IBIG Soft** (ibigsoft.com)

> Gestion complete des reseaux d'agences Mobile Money : transactions, flottes, commissions, comptabilite OHADA, KYC, RH/paie, support, notifications, assistant IA SARA, PWA offline.

---

## Stack technique

| Couche | Technologie |
|---|---|
| API | NestJS 10, Prisma 5, PostgreSQL 15 |
| Web | Next.js 14 App Router, TypeScript, Recharts |
| Monorepo | pnpm workspaces + Turborepo |
| Authentification | JWT access + refresh token httpOnly, 2FA TOTP, API Keys |
| Emails | Nodemailer (SMTP LWS — gestmoney@ibigsoft.com) |
| PWA | Service Worker, manifest, page offline |
| CI/CD | GitHub Actions — 8 workflows |
| Conteneurisation | Docker Compose (docker/) |
| Assistant IA | SARA (module ai NestJS) |

---

## Structure du monorepo

```
GESTMONEY/
├── apps/
│   ├── api/          # NestJS — 43 modules
│   └── web/          # Next.js 14 App Router
├── packages/
│   └── database/     # Prisma schema (87 modeles) + seeds
├── docker/           # Dockerfiles + docker-compose
├── docs/             # Documentation technique
└── .github/
    └── workflows/    # 8 workflows CI/CD
```

---

## Architecture des modules NestJS

```
auth          — JWT, 2FA, refresh, reset password
users         — profils utilisateurs
roles         — RBAC, permissions
tenants       — multi-tenant
agencies      — agences
agents        — agents terrain + super-agents
networks      — reseaux d'agences
transactions  — depot, retrait, transfert, paiement
float         — comptes de flotte, seuils, reapprovisionnement
cashier       — caissier, mouvements de caisse, coffre
commissions   — plans, paliers, calcul, paiements
accounting    — plan comptable OHADA, journal, grand livre
customers     — clients, comptes, fidelite
kyc           — verification KYC, dossiers
document-verification — verification de documents (endpoint public)
stock         — articles, produits, fournisseurs, BL
hr            — employes, contrats, paie, conges
support       — tickets, messages, pieces jointes
notifications — in-app, email, campagnes, alertes
ai            — SARA assistant IA (public + prive)
analytics     — agregats, rapports programmes
import        — import CSV/Excel
pdf           — generation PDF
webhooks      — endpoints, livraisons, evenements
api-keys      — cles API tierces
integrations  — log integrations
gateway       — WebSocket temps reel
onboarding    — etapes d'onboarding
superadmin    — console multi-tenant
licences      — abonnements, evenements, paiements
versions      — versioning logiciel
backup        — sauvegarde automatique
public-leads  — capture de prospects (endpoint public)
audit         — journal d'audit global
```

---

## Installation developpement

### Prerequis

- Node.js >= 20
- pnpm >= 9
- PostgreSQL 15
- Docker (optionnel, recommande)

### Demarrage

```bash
# 1. Cloner et installer les dependances
git clone <repo>
cd GESTMONEY
pnpm install

# 2. Configurer les variables d'environnement
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Editer les deux fichiers avec vos valeurs

# 3. Initialiser la base de donnees
pnpm db:generate      # generer le client Prisma
pnpm db:migrate       # appliquer les migrations
pnpm db:seed          # seed de base (admin + tenant demo)

# 4. (Optionnel) Seed donnees de demonstration
SEED_DEMO=true pnpm db:seed

# 5. Lancer en mode developpement
pnpm dev              # demarre api + web en parallele (Turborepo)
```

Les services ecoutent sur :
- API : http://localhost:3001
- Web : http://localhost:3000
- Swagger : http://localhost:3001/api/docs

### Demarrage via Docker

```bash
pnpm docker:dev       # docker-compose.dev.yml (hot-reload)
pnpm docker:up        # docker-compose.yml (prod-like)
pnpm docker:down      # arreter les conteneurs
```

---

## Variables d'environnement

### apps/api/.env

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | URL PostgreSQL | `postgresql://user:pass@localhost:5432/gestmoney` |
| `JWT_SECRET` | Secret JWT access token | chaine aleatoire >= 64 chars |
| `JWT_REFRESH_SECRET` | Secret JWT refresh token | chaine aleatoire >= 64 chars |
| `JWT_EXPIRES_IN` | Duree access token | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Duree refresh token | `7d` |
| `SMTP_HOST` | Hote SMTP | `ssl0.ovh.net` |
| `SMTP_PORT` | Port SMTP | `465` |
| `SMTP_USER` | Compte email | `gestmoney@ibigsoft.com` |
| `SMTP_PASS` | Mot de passe SMTP | *(secret)* |
| `SMTP_FROM` | Expediteur affiche | `GESTMONEY <gestmoney@ibigsoft.com>` |
| `API_URL` | URL publique de l'API | `https://gestmoney.ibigsoft.com/api` |
| `APP_URL` | URL publique du frontend | `https://gestmoney.ibigsoft.com` |
| `NODE_ENV` | Environnement | `production` |

### apps/web/.env.local

| Variable | Description | Exemple |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL API (build-time) | `https://gestmoney.ibigsoft.com/api` |
| `NEXT_PUBLIC_APP_URL` | URL app (build-time) | `https://gestmoney.ibigsoft.com` |

> **Attention** : les variables `NEXT_PUBLIC_*` sont embedees au moment du build Docker. Elles doivent etre passees comme `--build-arg` au `docker build` du service web, ou definies dans le workflow CI avant le build.

---

## Deploiement production

### VPS

- IP : `185.98.139.38`
- Domaine : `gestmoney.ibigsoft.com`
- OS : Linux, Docker + Docker Compose

### Procedure

```bash
# Sur le VPS
ssh root@185.98.139.38
cd /opt/gestmoney

# Tirer les derniers changements
git pull origin main

# Appliquer les migrations
docker compose -f docker/docker-compose.yml exec api npx prisma migrate deploy

# Rebuild et redemarrer
docker compose -f docker/docker-compose.yml up --build -d
```

### Secrets GitHub Actions requis

| Secret | Valeur |
|---|---|
| `VPS_SSH_KEY` | Cle privee SSH pour 185.98.139.38 |
| `NEXT_PUBLIC_API_URL` | `https://gestmoney.ibigsoft.com/api` |
| `NEXT_PUBLIC_APP_URL` | `https://gestmoney.ibigsoft.com` |
| `DATABASE_URL` | URL PostgreSQL production |
| `JWT_SECRET` | Secret JWT production |
| `JWT_REFRESH_SECRET` | Secret refresh production |
| `SMTP_PASS` | Mot de passe SMTP LWS |

Creer un environnement GitHub **"production"** avec protection de branche sur `main`.

---

## Migrations en attente

| Migration | Description |
|---|---|
| `20260722010000_ticket_message_piece_jointe` | Pieces jointes sur les messages de tickets |
| `20260722020000_customer_kyc_flow` | Flux KYC clients etendu |
| `20260726010000_sara_categorie_question` | Categories de questions SARA |

Appliquer avec : `npx prisma migrate deploy` (ou `pnpm db:migrate` en dev).

---

## Tests

```bash
pnpm test             # tests unitaires Jest (apps/api)
pnpm test:unit        # alias unitaires
pnpm test:web         # tests web
pnpm test:e2e         # tests E2E NestJS (jest-e2e.json)
pnpm test:coverage    # couverture de code
```

Tests E2E Playwright (web) :

```bash
cd apps/web
npx playwright test
```

---

## Comptes par defaut (apres seed)

| Role | Email | Mot de passe |
|---|---|---|
| Super Admin | admin@gestmoney.ibigsoft.com | Gestmoney@2026 |

> Changer le mot de passe immediatement apres le premier deploiement.

---

## Contacts

- Email : gestmoney@ibigsoft.com
- Tel : +225 27 22 27 60 14
- Site editeur : ibigsoft.com
- Domaine production : gestmoney.ibigsoft.com

---

*GESTMONEY v1.0.0 — IBIG Soft — Juillet 2026*
