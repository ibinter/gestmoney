# Guide de déploiement GESTMONEY

## Prérequis

- Docker et Docker Compose installés sur le serveur
- Accès SSH au VPS (185.98.139.38)
- Variables d'environnement configurées dans `/opt/gestmoney/.env`

---

## Sauvegarde et restauration

### Scripts disponibles

| Script | Rôle |
|--------|------|
| `scripts/backup-db.sh` | Sauvegarde compressée de la base PostgreSQL |
| `scripts/restore-db.sh` | Restauration depuis un fichier `.sql.gz` |

### Installation des scripts sur le serveur

```bash
# Copier les scripts et les rendre exécutables
sudo mkdir -p /opt/gestmoney/scripts /opt/gestmoney/backups
sudo cp scripts/backup-db.sh  /opt/gestmoney/scripts/
sudo cp scripts/restore-db.sh /opt/gestmoney/scripts/
sudo chmod +x /opt/gestmoney/scripts/*.sh
```

### Sauvegarde manuelle

```bash
# Depuis le serveur
POSTGRES_USER=gestmoney_user POSTGRES_DB=gestmoney_db /opt/gestmoney/scripts/backup-db.sh

# Via l'API SuperAdmin (curl)
curl -X POST https://gestmoney.ibigsoft.com/api/admin/backups/trigger \
  -H "Authorization: Bearer <TOKEN_SUPERADMIN>"
```

Les fichiers sont stockés dans `/opt/gestmoney/backups/` au format `gestmoney_YYYYMMDD_HHMMSS.sql.gz`.
La rétention est de **30 jours** (les fichiers plus anciens sont supprimés automatiquement).

### Sauvegarde automatique (cron NestJS)

Le scheduler NestJS (`BackupScheduler`) déclenche automatiquement une sauvegarde **chaque nuit à 02h00**.
Aucune configuration cron système n'est nécessaire tant que le conteneur API est en cours d'exécution.

Pour vérifier que le scheduler tourne, consulter les logs de l'API :

```bash
docker logs gestmoney_api --tail 50 | grep -i sauvegarde
```

### Lister les sauvegardes disponibles

```bash
# En ligne de commande
ls -lh /opt/gestmoney/backups/*.sql.gz

# Via l'API SuperAdmin
curl https://gestmoney.ibigsoft.com/api/admin/backups \
  -H "Authorization: Bearer <TOKEN_SUPERADMIN>"
```

### Restauration

> **ATTENTION** : la restauration écrase intégralement la base de données en cours.
> Réalisez une sauvegarde préalable avant toute restauration.

```bash
# Remplacer le nom du fichier par celui voulu
POSTGRES_USER=gestmoney_user POSTGRES_DB=gestmoney_db \
  /opt/gestmoney/scripts/restore-db.sh \
  /opt/gestmoney/backups/gestmoney_20260101_020000.sql.gz
```

Le script demande une confirmation interactive (`oui`) avant d'écraser les données.

---

## Variables d'environnement de la base de données

Les scripts lisent les variables d'environnement suivantes (avec valeurs par défaut) :

| Variable | Valeur par défaut |
|----------|-------------------|
| `POSTGRES_USER` | `gestmoney_user` |
| `POSTGRES_DB` | `gestmoney_db` |

Ces variables doivent correspondre à celles définies dans `docker-compose.yml` et `/opt/gestmoney/.env`.
