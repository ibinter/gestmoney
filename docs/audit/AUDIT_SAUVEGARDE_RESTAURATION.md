# AUDIT SAUVEGARDE & RESTAURATION — GESTMONEY

> Généré le 2026-07-26

## État actuel

| Composant | Sauvegarde | Fréquence | Rétention | État |
|---|---|---|---|---|
| Base de données PostgreSQL | ❌ Absente | — | — | Critique |
| Fichiers uploadés | N/A | — | — | Stockage en DB (base64) |
| Configuration `.env` | ❌ Manuelle | — | — | À documenter |
| Code source | ✅ Git | À chaque commit | Indéfini | OK |

---

## Scripts de sauvegarde existants

**Résultat de la recherche** : aucun script de backup dédié n'a été trouvé dans le projet (hors node_modules).

Le fichier `.github/workflows/deploy-production.yml` existe mais ne contient pas de logique de backup — il s'agit du workflow de déploiement CI/CD.

---

## Risques

| Risque | Gravité | Impact |
|---|---|---|
| Perte totale de données en cas de défaillance disque VPS | Critique | Irréversible sans backup |
| Corruption de la base lors d'une migration Prisma ratée | Haute | Downtime prolongé |
| Suppression accidentelle de données par un SUPER_ADMIN | Haute | Irrécupérable sans backup |
| Panne VPS sans snapshot | Haute | Perte de toutes les données |

---

## Procédure de sauvegarde recommandée

### Sauvegarde manuelle immédiate

```bash
# Sur le VPS
DATE=$(date +%Y%m%d_%H%M%S)
docker exec gestmoney_postgres pg_dump \
  -U gestmoney_user gestmoney_db \
  | gzip > /opt/backups/gestmoney_${DATE}.sql.gz

# Vérifier
ls -lh /opt/backups/
```

### Script de sauvegarde automatique (cron)

Créer `/opt/gestmoney/scripts/backup.sh` :

```bash
#!/bin/bash
set -e
BACKUP_DIR=/opt/backups/gestmoney
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M)
FILE="${BACKUP_DIR}/gestmoney_${DATE}.sql.gz"

docker exec gestmoney_postgres pg_dump \
  -U gestmoney_user gestmoney_db \
  | gzip > "$FILE"

# Rétention 30 jours
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "Backup OK: $FILE ($(du -h $FILE | cut -f1))"
```

Ajouter au cron root (`crontab -e`) :
```
0 2 * * * /opt/gestmoney/scripts/backup.sh >> /var/log/gestmoney-backup.log 2>&1
```

---

## Procédure de restauration

```bash
# 1. Identifier le backup
ls -lh /opt/backups/gestmoney/

# 2. Restaurer
zcat /opt/backups/gestmoney/gestmoney_YYYYMMDD_HHMM.sql.gz \
  | docker exec -i gestmoney_postgres psql \
    -U gestmoney_user gestmoney_db

# 3. Redémarrer l'API
docker restart gestmoney_api
```

---

## Plan d'action prioritaire

1. **Immédiat** : créer `mkdir -p /opt/backups/gestmoney` et effectuer un premier dump manuel.
2. **J+1** : installer le script `backup.sh` et le cron quotidien à 2h.
3. **J+7** : configurer la copie des backups vers un stockage distant (Scaleway Object Storage ou similaire).
4. **J+30** : tester la restauration en environnement de staging.
