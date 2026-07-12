# GESTMONEY — Guide de contribution

Merci de contribuer à GESTMONEY ! Ce guide décrit les conventions et processus
à suivre pour maintenir la qualité du code.

---

## Table des matières

1. [Prérequis de développement](#prérequis)
2. [Configuration de l'environnement local](#environnement)
3. [Conventions de code](#conventions)
4. [Nommage des branches](#branches)
5. [Conventional Commits](#commits)
6. [Processus de Pull Request](#pull-request)
7. [Standards de test](#tests)

---

## Prérequis

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose
- Python 3.11+ (pour le service IA)
- Git 2.40+

---

## Configuration de l'environnement local

```bash
# 1. Cloner le dépôt
git clone https://github.com/ibig-soft/gestmoney.git
cd gestmoney

# 2. Installer les dépendances
pnpm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec les valeurs de développement

# 4. Démarrer les services Docker (PostgreSQL, Redis)
make docker-up
# ou : docker compose -f docker/docker-compose.dev.yml up -d

# 5. Migrations et seed
make db-migrate
make db-seed

# 6. Démarrer en mode développement
make dev
# ou : pnpm dev
```

L'application est disponible sur :
- Frontend : http://localhost:3000
- API : http://localhost:3001
- API Swagger : http://localhost:3001/api/docs

---

## Conventions de code

### TypeScript

- **Strictement typé** : pas de `any` sauf justification documentée
- **Pas de `// @ts-ignore`** sans commentaire explicatif
- **Interfaces plutôt que types** pour les objets publics
- **Énumérations** pour les valeurs constantes (ex: `TransactionType`)
- **Barrel files** : chaque module exporte via `index.ts`

### NestJS (API)

```typescript
// Nommage des classes
@Controller('transactions')           // ✅ kebab-case pour les routes
export class TransactionsController { // ✅ PascalCase pour les classes

// DTOs : suffixe Dto
export class CreateTransactionDto { } // ✅
export class CreateTransaction { }    // ❌

// Services : suffixe Service
export class TransactionsService { }  // ✅

// Guards : suffixe Guard
export class JwtAuthGuard { }         // ✅
```

- Utiliser `class-validator` pour tous les DTOs
- Documenter avec `@ApiOperation`, `@ApiResponse` (Swagger)
- Toujours filtrer par `tenantId` dans les requêtes

### Next.js (Frontend)

- **App Router** : utiliser les Server Components par défaut
- **Client Components** : préfixer `"use client"` uniquement si nécessaire
- **Hooks** : préfixer `use` (ex: `useTransactions`)
- **Stores Zustand** : suffixe `Store` (ex: `authStore.ts`)

### CSS

- Tailwind CSS uniquement (pas de CSS inline ni de modules CSS)
- Classes d'utilitaires avec `cn()` (clsx + tailwind-merge)

---

## Nommage des branches

Format : `<type>/<description-courte>`

| Type | Usage | Exemple |
|------|-------|---------|
| `feat/` | Nouvelle fonctionnalité | `feat/float-alerts` |
| `fix/` | Correction de bug | `fix/commission-rounding` |
| `refactor/` | Refactoring sans changement fonctionnel | `refactor/auth-module` |
| `docs/` | Documentation uniquement | `docs/api-endpoints` |
| `test/` | Ajout ou correction de tests | `test/transaction-service` |
| `ci/` | CI/CD, pipeline | `ci/add-e2e-tests` |
| `chore/` | Maintenance, dépendances | `chore/update-prisma` |

**Règles :**
- Toujours partir de `develop` (jamais directement de `main`)
- Description en kebab-case, en français ou anglais
- Maximum 50 caractères

```bash
# Créer une branche correctement
git checkout develop
git pull origin develop
git checkout -b feat/mon-module
```

---

## Conventional Commits

Format : `<type>(<scope>): <description>`

### Types

| Type | Description |
|------|-------------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Refactoring |
| `test` | Ajout/modification de tests |
| `docs` | Documentation |
| `ci` | Modification CI/CD |
| `chore` | Maintenance |
| `perf` | Amélioration de performance |
| `style` | Formatage (pas de changement logique) |
| `revert` | Annulation d'un commit précédent |

### Scopes (modules)

`auth`, `transactions`, `float`, `commissions`, `accounting`, `users`,
`network`, `agencies`, `agents`, `customers`, `ai`, `ci`, `db`, `shared`

### Exemples

```bash
# Fonctionnalité
git commit -m "feat(transactions): ajouter le calcul des frais Wave"

# Bug fix avec numéro d'issue
git commit -m "fix(float): corriger arrondi balance Orange Money

Le solde était arrondi à 2 décimales au lieu de l'entier XOF.

Closes #142"

# Breaking change
git commit -m "feat(api)!: changer le format de réponse des transactions

BREAKING CHANGE: Le champ 'amount' est maintenant en centimes (XOF * 100)"

# Plusieurs fichiers, scope générique
git commit -m "refactor(auth): migrer vers RS256 (depuis HS256)"
```

### Règles

- **Description en minuscules**, sans point final
- **Corps optionnel** : ligne vide après le titre, puis description détaillée
- **Footer** : pour les breaking changes ou les issues liées
- **Impératif** : "ajouter" et non "ajouté" ou "ajoute"

---

## Processus de Pull Request

### 1. Avant d'ouvrir une PR

```bash
# Vérifier que tous les tests passent
pnpm test

# Vérifier le lint
pnpm lint

# Vérifier le build
pnpm build

# Rebaser sur develop
git fetch origin
git rebase origin/develop
```

### 2. Création de la PR

- Cibler la branche `develop` (jamais `main` directement)
- Remplir le template de PR fourni dans `.github/PULL_REQUEST_TEMPLATE.md`
- Assigner au moins un reviewer
- Lier l'issue correspondante avec `Closes #N`

### 3. Review

**Critères d'acceptation :**
- CI entièrement verte (lint, tests, build, sécurité)
- Au moins 1 approbation (2 pour les modules critiques : auth, transactions)
- Tous les commentaires de review résolus
- Pas de secrets dans le code
- Tests ajoutés pour les nouvelles fonctionnalités

**Délais :**
- Première review : 48h ouvrées
- Re-review après modifications : 24h ouvrées

### 4. Merge

- Merge via **Squash and merge** sur `develop`
- Le message du commit squash doit suivre les Conventional Commits
- Supprimer la branche après merge

---

## Standards de test

### API (Jest)

```bash
# Tests unitaires
pnpm --filter @gestmoney/api test

# Tests unitaires avec watch
pnpm --filter @gestmoney/api test:watch

# Coverage (minimum 80%)
pnpm --filter @gestmoney/api test:cov

# Tests E2E
pnpm --filter @gestmoney/api test:e2e
```

**Conventions de nommage :**

```typescript
// Fichier : transactions.service.spec.ts
describe('TransactionsService', () => {
  describe('create()', () => {
    it('should create a DEPOSIT transaction successfully', async () => { });
    it('should throw InsufficientFloatException when balance is low', async () => { });
    it('should emit TRANSACTION_COMPLETED event on success', async () => { });
  });
});
```

**Ce qu'il faut tester :**
- Cas nominal (happy path)
- Cas d'erreur attendus (exceptions métier)
- Cas limites (montant zéro, chaîne vide, etc.)
- Interactions avec les dépendances (mocks)

### Frontend (Vitest)

```bash
pnpm --filter @gestmoney/web test
pnpm --filter @gestmoney/web test:ui  # Interface visuelle Vitest
```

### Python (pytest)

```bash
cd apps/ai-service
pytest -v
pytest --cov=. --cov-report=term-missing
```

---

## Questions et aide

- **Slack** : canal `#dev-gestmoney`
- **Issues GitHub** : pour les bugs et demandes de fonctionnalité
- **Discussions GitHub** : pour les questions architecturales
