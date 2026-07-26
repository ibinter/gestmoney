#!/bin/bash
# Restauration PostgreSQL GESTMONEY
# Usage: ./restore-db.sh /opt/gestmoney/backups/gestmoney_20260101_120000.sql.gz
set -e

BACKUP_FILE="$1"
if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <fichier_backup.sql.gz>"
  echo "Fichiers disponibles :"
  ls -lh /opt/gestmoney/backups/*.sql.gz 2>/dev/null || echo "  (aucun)"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Erreur : fichier introuvable : $BACKUP_FILE"
  exit 1
fi

echo "ATTENTION : Cette opération va écraser la base de données actuelle."
read -p "Confirmer la restauration depuis $BACKUP_FILE ? (oui/non) : " CONFIRM
if [ "$CONFIRM" != "oui" ]; then echo "Annulé."; exit 0; fi

gunzip -c "$BACKUP_FILE" | docker exec -i gestmoney_postgres psql -U "${POSTGRES_USER:-gestmoney_user}" "${POSTGRES_DB:-gestmoney_db}"
echo "Restauration terminée."
