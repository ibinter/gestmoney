#!/bin/bash
# Script de migration Prisma — GESTMONEY Phase 2-4
# Exécuter depuis la racine du monorepo : bash packages/database/migrate.sh

set -e

echo "=== GESTMONEY — Migration Prisma ==="
echo ""

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL non définie. Exportez-la avant d'exécuter ce script."
  echo "   export DATABASE_URL=postgresql://user:password@host:5432/gestmoney"
  exit 1
fi

echo "✅ DATABASE_URL détectée"
echo ""

echo "📦 Génération du client Prisma..."
pnpm --filter @gestmoney/database exec prisma generate

echo ""
echo "🔄 Application des migrations..."
pnpm --filter @gestmoney/database exec prisma migrate deploy

echo ""
echo "✅ Migration terminée."
echo ""
echo "ℹ️  Pour créer une nouvelle migration en développement :"
echo "   pnpm --filter @gestmoney/database exec prisma migrate dev --name <nom>"
