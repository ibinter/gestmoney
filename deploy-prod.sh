#!/bin/bash
# =============================================================================
# GESTMONEY - Script de déploiement production
# Usage: bash deploy-prod.sh
# =============================================================================
set -e

echo "=========================================="
echo "  GESTMONEY - Déploiement Production"
echo "=========================================="

# Arrêter les anciens conteneurs
docker rm -f gestmoney_api gestmoney_web 2>/dev/null || true

# 1. Vérifier que DB et Redis tournent
echo "[1/5] Vérification PostgreSQL + Redis..."
docker ps --filter name=gestmoney_postgres --filter name=gestmoney_redis \
  --format "{{.Names}}: {{.Status}}" || true

# Démarrer si pas actifs
docker run -d --name gestmoney_postgres --restart unless-stopped \
  --env-file /opt/gestmoney/.env \
  -p 5433:5432 \
  -v gestmoney_postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine 2>/dev/null || echo "PostgreSQL déjà actif"

docker run -d --name gestmoney_redis --restart unless-stopped \
  -p 6380:6379 \
  -v gestmoney_redis_data:/data \
  redis:7-alpine 2>/dev/null || echo "Redis déjà actif"

sleep 5

# 2. Lancer les migrations Prisma
echo "[2/5] Migration de la base de données..."
DB_URL=$(grep DATABASE_URL /opt/gestmoney/.env | cut -d= -f2-)

# Remplacer 'postgres' (hostname Docker) par '127.0.0.1' pour la migration locale
DB_URL_LOCAL=$(echo "$DB_URL" | sed 's/@postgres:/@127.0.0.1:/g' | sed 's/5432/5433/g')

docker run --rm \
  --network host \
  -e DATABASE_URL="$DB_URL_LOCAL" \
  gestmoney_api:latest \
  sh -c "cd /app && ls node_modules/.bin/prisma 2>/dev/null && node_modules/.bin/prisma migrate deploy || echo 'prisma migrate skipped'" 2>&1 || true

echo "[3/5] Seed des données de démo..."
docker run --rm \
  --network host \
  -e DATABASE_URL="$DB_URL_LOCAL" \
  gestmoney_api:latest \
  sh -c "node /app/apps/api/dist/prisma/prisma.service.js 2>/dev/null || echo 'seed skipped'" 2>&1 || true

# 3. Démarrer l'API
echo "[4/5] Démarrage API NestJS (port 3010)..."
docker run -d \
  --name gestmoney_api \
  --restart unless-stopped \
  --network host \
  --env-file /opt/gestmoney/.env \
  -e REDIS_URL='redis://127.0.0.1:6380' \
  -e PORT=3010 \
  -e NODE_ENV=production \
  gestmoney_api:latest

sleep 8

echo "Logs API:"
docker logs gestmoney_api --tail 20 2>&1

# 4. Démarrer le frontend
echo "[5/5] Démarrage Frontend Next.js (port 3011)..."
docker run -d \
  --name gestmoney_web \
  --restart unless-stopped \
  --network host \
  -e NEXT_PUBLIC_API_URL='http://gestmoney.ibigsoft.com/api/v1' \
  -e NEXT_PUBLIC_APP_URL='http://gestmoney.ibigsoft.com' \
  -e NEXT_PUBLIC_APP_NAME='GESTMONEY' \
  -e NEXT_PUBLIC_TENANT_ID='cmrfpl9on0000x4b78n0u1b31' \
  -e PORT=3011 \
  -e NODE_ENV=production \
  gestmoney_web:latest

sleep 5
echo "Logs Web:"
docker logs gestmoney_web --tail 10 2>&1

echo ""
echo "=========================================="
echo "  Conteneurs GESTMONEY:"
docker ps --filter name=gestmoney --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "  Test API:"
curl -s http://localhost:3010/api/v1/health 2>/dev/null && echo " API OK" || echo " API pas encore prête"
echo ""
echo "  Test Web:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3011 2>/dev/null && echo " Web OK" || echo " Web pas encore prêt"
echo "=========================================="
