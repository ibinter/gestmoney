# GUIDE DE DÉPLOIEMENT — GESTMONEY

> Généré le 2026-07-26 | VPS : 185.98.139.38 | Domaine : gestmoney.ibigsoft.com

## Infrastructure

| Composant | Technologie | Port |
|---|---|---|
| API (NestJS) | Docker (gestmoney_api) | 3010 (prod) |
| Web (Next.js) | Docker (gestmoney_web) | 3000 |
| Base de données | PostgreSQL 16 Alpine | 5433 (Docker → 5432) |
| Cache | Redis 7 Alpine | 6380 (Docker → 6379) |
| Reverse proxy | Nginx / Cloudflare | 80/443 |

---

## Déploiement complet (depuis zéro)

### 1. Connexion SSH

```bash
ssh root@185.98.139.38
```

### 2. Cloner / mettre à jour le code

```bash
cd /opt/gestmoney
git pull origin main
```

### 3. Construire les images Docker

```bash
# API
docker build -t gestmoney_api:latest -f docker/Dockerfile.api .

# Web
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://gestmoney.ibigsoft.com/api/v1 \
  --build-arg NEXT_PUBLIC_APP_URL=https://gestmoney.ibigsoft.com \
  -t gestmoney_web:latest -f docker/Dockerfile.web .
```

> ⚠️ **Important** : `NEXT_PUBLIC_*` doit être passé en `--build-arg` à la construction — ces variables sont injectées au build, pas au runtime.

### 4. Lancer le script de déploiement

```bash
bash /opt/gestmoney/deploy-prod.sh
```

Le script réalise automatiquement :
1. Arrêt des anciens conteneurs
2. Vérification PostgreSQL + Redis (démarrage si nécessaire)
3. Migration Prisma (`prisma migrate deploy`)
4. Seed des données de démo (optionnel)
5. Démarrage API (port 3010)
6. Démarrage Web (port 3000)

### 5. Vérification

```bash
# Santé de l'API
curl https://gestmoney.ibigsoft.com/api/v1/health

# Logs API
docker logs gestmoney_api --tail 50

# Logs Web
docker logs gestmoney_web --tail 50
```

---

## Mise à jour rapide (rolling update)

```bash
cd /opt/gestmoney
git pull origin main
docker build -t gestmoney_api:latest -f docker/Dockerfile.api .
docker rm -f gestmoney_api
# Reprendre à l'étape 4 du script
bash /opt/gestmoney/deploy-prod.sh
```

---

## Migrations de base de données

```bash
# En local (dev)
pnpm prisma migrate dev --name <nom_migration>

# En production (VPS)
# La migration est automatisée dans deploy-prod.sh
# Pour une migration manuelle :
docker run --rm \
  --network host \
  -e DATABASE_URL="postgresql://..." \
  gestmoney_api:latest \
  sh -c "node_modules/.bin/prisma migrate deploy"
```

---

## Variables d'environnement requises en production

Fichier : `/opt/gestmoney/.env`

| Variable | Description | Obligatoire |
|---|---|---|
| `DATABASE_URL` | URL PostgreSQL complète | ✅ |
| `REDIS_URL` | URL Redis | ✅ |
| `JWT_SECRET` | Clé secrète JWT (min 32 chars) | ✅ |
| `JWT_REFRESH_SECRET` | Clé refresh JWT | ✅ |
| `NEXT_PUBLIC_API_URL` | URL de l'API depuis le navigateur | ✅ (build-arg) |
| `NEXT_PUBLIC_APP_URL` | URL de l'app | ✅ (build-arg) |
| `SMTP_HOST` | Serveur SMTP | ⚠️ Optionnel (emails simulés si vide) |
| `SMTP_USER` | Compte SMTP | ⚠️ |
| `SMTP_PASS` | Mot de passe SMTP | ⚠️ |
| `ORANGE_MONEY_*` | Clés Orange Money | ⚠️ Si utilisé |
| `MTN_MOMO_*` | Clés MTN MoMo | ⚠️ Si utilisé |
| `WAVE_API_KEY` | Clé Wave | ⚠️ Si utilisé |
| `ENCRYPTION_KEY` | Clé chiffrement 32 chars | ✅ |
| `AI_API_KEY` | Clé Claude/OpenAI (SARA) | ⚠️ Si IA activée |

---

## Rollback

```bash
# Revenir au commit précédent
cd /opt/gestmoney
git checkout <commit_hash>
# Reconstruire et redéployer
bash /opt/gestmoney/deploy-prod.sh
```

---

## Surveillance

```bash
# Voir tous les conteneurs
docker ps

# Voir utilisation ressources
docker stats

# Logs en temps réel
docker logs -f gestmoney_api
```
