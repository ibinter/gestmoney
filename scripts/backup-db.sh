#!/bin/bash
# Sauvegarde PostgreSQL automatique GESTMONEY
set -e

BACKUP_DIR="/opt/gestmoney/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="gestmoney_${DATE}.sql.gz"
KEEP_DAYS=30  # Conserver 30 jours de sauvegardes

mkdir -p "$BACKUP_DIR"

# Dump compressé
docker exec gestmoney_postgres pg_dump -U "${POSTGRES_USER:-gestmoney_user}" "${POSTGRES_DB:-gestmoney_db}" | gzip > "${BACKUP_DIR}/${FILENAME}"

# Nettoyage des anciens fichiers
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +${KEEP_DAYS} -delete

echo "[$(date)] Sauvegarde créée : ${FILENAME} ($(du -sh ${BACKUP_DIR}/${FILENAME} | cut -f1))"
