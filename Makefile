# GESTMONEY — Makefile
# Usage : make <cible>

.PHONY: help dev test build db-migrate db-seed docker-up docker-down logs clean \
        lint lint-fix format type-check test-api test-web test-ai test-e2e \
        build-api build-web docker-pull docker-restart db-studio db-reset

# Couleurs
CYAN  := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RESET := \033[0m

# ─────────────────────────────────────────────────────────────────────────────
# Aide
# ─────────────────────────────────────────────────────────────────────────────

help: ## Afficher cette aide
	@echo ""
	@echo "$(CYAN)GESTMONEY — Commandes disponibles$(RESET)"
	@echo "══════════════════════════════════════════"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Développement
# ─────────────────────────────────────────────────────────────────────────────

dev: ## Lancer tous les services en mode développement
	@echo "$(CYAN)Démarrage en mode développement...$(RESET)"
	pnpm dev

dev-api: ## Lancer uniquement l'API NestJS
	pnpm --filter @gestmoney/api dev

dev-web: ## Lancer uniquement le frontend Next.js
	pnpm --filter @gestmoney/web dev

dev-ai: ## Lancer le service IA Python
	cd apps/ai-service && python -m uvicorn main:app --reload --port 8000

# ─────────────────────────────────────────────────────────────────────────────
# Tests
# ─────────────────────────────────────────────────────────────────────────────

test: ## Lancer tous les tests (API + Web + IA)
	@echo "$(CYAN)Lancement des tests...$(RESET)"
	pnpm test

test-api: ## Tests unitaires API (Jest)
	pnpm --filter @gestmoney/api test

test-api-cov: ## Tests API avec rapport de coverage
	pnpm --filter @gestmoney/api test:cov

test-web: ## Tests frontend (Vitest)
	pnpm --filter @gestmoney/web test

test-ai: ## Tests service IA (pytest)
	cd apps/ai-service && pytest -v

test-e2e: ## Tests E2E (nécessite PostgreSQL + Redis)
	pnpm --filter @gestmoney/api test:e2e

test-watch: ## Tests API en mode watch
	pnpm --filter @gestmoney/api test:watch

# ─────────────────────────────────────────────────────────────────────────────
# Build
# ─────────────────────────────────────────────────────────────────────────────

build: ## Build de tous les packages pour la production
	@echo "$(CYAN)Build production...$(RESET)"
	pnpm build

build-api: ## Build uniquement l'API NestJS
	pnpm --filter @gestmoney/api build

build-web: ## Build uniquement le frontend Next.js
	pnpm --filter @gestmoney/web build

type-check: ## Vérification TypeScript sans compilation
	pnpm type-check

# ─────────────────────────────────────────────────────────────────────────────
# Base de données
# ─────────────────────────────────────────────────────────────────────────────

db-migrate: ## Exécuter les migrations Prisma
	@echo "$(CYAN)Migrations Prisma...$(RESET)"
	pnpm --filter @gestmoney/database db:migrate

db-migrate-create: ## Créer une nouvelle migration (NAME=nom_migration)
	pnpm --filter @gestmoney/database exec prisma migrate dev --name $(NAME)

db-seed: ## Charger les données de démonstration
	@echo "$(CYAN)Seed données démo...$(RESET)"
	pnpm db:seed

db-reset: ## Réinitialiser la base de données et reseed (⚠️ DESTRUCTIF)
	@echo "$(YELLOW)⚠️  Réinitialisation de la base de données...$(RESET)"
	pnpm --filter @gestmoney/database exec prisma migrate reset --force
	pnpm db:seed

db-studio: ## Ouvrir Prisma Studio (interface graphique DB)
	pnpm --filter @gestmoney/database db:studio

db-generate: ## Régénérer le client Prisma après modification du schéma
	pnpm --filter @gestmoney/database db:generate

db-push: ## Pousser le schéma sans migration (développement uniquement)
	pnpm --filter @gestmoney/database db:push

db-backup: ## Créer un backup PostgreSQL local
	@echo "$(CYAN)Backup PostgreSQL...$(RESET)"
	docker compose -f docker/docker-compose.dev.yml exec postgres \
		pg_dump -U gestmoney gestmoney_dev \
		> backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup créé dans ./backups/$(RESET)"

# ─────────────────────────────────────────────────────────────────────────────
# Docker
# ─────────────────────────────────────────────────────────────────────────────

docker-up: ## Démarrer les conteneurs Docker (PostgreSQL, Redis)
	@echo "$(CYAN)Démarrage Docker...$(RESET)"
	docker compose -f docker/docker-compose.yml up -d

docker-up-dev: ## Démarrer Docker en mode développement (avec hot-reload)
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d

docker-down: ## Arrêter les conteneurs Docker
	@echo "$(CYAN)Arrêt Docker...$(RESET)"
	docker compose -f docker/docker-compose.yml down

docker-down-v: ## Arrêter Docker et supprimer les volumes (⚠️ DESTRUCTIF)
	docker compose -f docker/docker-compose.yml down -v

docker-pull: ## Mettre à jour les images Docker depuis le registry
	docker compose pull

docker-restart: ## Redémarrer tous les services Docker
	docker compose restart

docker-build: ## Construire les images Docker localement
	docker compose build

# ─────────────────────────────────────────────────────────────────────────────
# Logs
# ─────────────────────────────────────────────────────────────────────────────

logs: ## Afficher les logs de tous les services (follow)
	docker compose logs -f

logs-api: ## Logs de l'API uniquement
	docker compose logs -f api

logs-web: ## Logs du frontend uniquement
	docker compose logs -f web

logs-db: ## Logs PostgreSQL
	docker compose logs -f postgres

logs-redis: ## Logs Redis
	docker compose logs -f redis

# ─────────────────────────────────────────────────────────────────────────────
# Qualité du code
# ─────────────────────────────────────────────────────────────────────────────

lint: ## Linting ESLint sur tout le projet
	pnpm lint

lint-fix: ## Correction automatique ESLint
	pnpm lint:fix

format: ## Formatage Prettier sur tout le projet
	pnpm format

format-check: ## Vérification du formatage sans modification
	pnpm format:check

# ─────────────────────────────────────────────────────────────────────────────
# Installation & Setup
# ─────────────────────────────────────────────────────────────────────────────

install: ## Installer toutes les dépendances
	pnpm install

install-frozen: ## Installer les dépendances sans mise à jour du lockfile (CI)
	pnpm install --frozen-lockfile

setup: ## Configuration initiale complète (install + docker + migrate + seed)
	@echo "$(CYAN)Configuration initiale de GESTMONEY...$(RESET)"
	$(MAKE) install
	$(MAKE) docker-up
	@echo "Attente que PostgreSQL soit prêt..."
	@sleep 5
	$(MAKE) db-migrate
	$(MAKE) db-seed
	@echo "$(GREEN)Setup terminé ! Lancez 'make dev' pour démarrer.$(RESET)"

# ─────────────────────────────────────────────────────────────────────────────
# Nettoyage
# ─────────────────────────────────────────────────────────────────────────────

clean: ## Supprimer node_modules et les dossiers dist/build
	@echo "$(YELLOW)Nettoyage...$(RESET)"
	pnpm clean
	find . -name "*.js.map" -not -path "*/node_modules/*" -delete
	@echo "$(GREEN)Nettoyage terminé$(RESET)"

clean-docker: ## Supprimer les images Docker inutilisées
	docker image prune -f
	docker builder prune -f

# ─────────────────────────────────────────────────────────────────────────────
# Sécurité
# ─────────────────────────────────────────────────────────────────────────────

audit: ## Audit de sécurité des dépendances npm
	pnpm audit

audit-fix: ## Correction automatique des vulnérabilités npm
	pnpm audit --fix

security-python: ## Audit de sécurité des dépendances Python
	cd apps/ai-service && pip install safety && safety check -r requirements.txt

# ─────────────────────────────────────────────────────────────────────────────
# Utilitaires
# ─────────────────────────────────────────────────────────────────────────────

swagger: ## Ouvrir la documentation Swagger API
	@echo "Swagger disponible sur : http://localhost:3001/api/docs"
	open http://localhost:3001/api/docs 2>/dev/null || xdg-open http://localhost:3001/api/docs 2>/dev/null || true

health: ## Vérifier la santé des services
	@echo "$(CYAN)Health checks...$(RESET)"
	@curl -s http://localhost:3001/health | python3 -m json.tool || echo "API: KO"
	@curl -s http://localhost:3000 > /dev/null && echo "Web: OK" || echo "Web: KO"

version: ## Afficher les versions des outils
	@echo "Node.js : $$(node --version)"
	@echo "pnpm    : $$(pnpm --version)"
	@echo "Docker  : $$(docker --version)"
	@echo "Git     : $$(git --version)"

.DEFAULT_GOAL := help
