# Guide CI/CD — GESTMONEY

## Vue d'ensemble

Le pipeline CI/CD est composé de 3 workflows GitHub Actions :

| Workflow | Déclencheur | Rôle |
|----------|-------------|------|
| `deploy.yml` | Push sur `main` + déclenchement manuel | Tests → Build → Déploiement VPS production |
| `pr-check.yml` | Pull Request vers `main` | Lint + Tests + Build + commentaire automatique |
| `backup.yml` | Tous les jours à 01h UTC + déclenchement manuel | Backup base de données via SSH |

---

## Variables GitHub Secrets à configurer

Aller dans **Settings → Secrets and variables → Actions** du dépôt GitHub.

| Secret | Description | Exemple |
|--------|-------------|---------|
| `VPS_SSH_KEY` | Clé privée SSH pour se connecter au VPS | Contenu de `~/.ssh/id_ed25519` |
| `NEXT_PUBLIC_API_URL` | URL publique de l'API (build Next.js) | `https://gestmoney.ibigsoft.com/api` |
| `NEXT_PUBLIC_APP_URL` | URL publique du frontend (build Next.js) | `https://gestmoney.ibigsoft.com` |

---

## Générer la clé SSH pour GitHub Actions

### 1. Générer la paire de clés (en local ou sur le VPS)

```bash
ssh-keygen -t ed25519 -C "github-actions@gestmoney" -f ~/.ssh/github_actions_gestmoney
```

Deux fichiers sont créés :
- `~/.ssh/github_actions_gestmoney` — clé **privée** (va dans le secret GitHub)
- `~/.ssh/github_actions_gestmoney.pub` — clé **publique** (va sur le VPS)

### 2. Ajouter la clé publique sur le VPS

```bash
ssh root@185.98.139.38
cat >> ~/.ssh/authorized_keys << 'EOF'
<contenu de github_actions_gestmoney.pub>
EOF
chmod 600 ~/.ssh/authorized_keys
```

### 3. Ajouter la clé privée dans GitHub Secrets

Copier le contenu de `~/.ssh/github_actions_gestmoney` (en-tête `-----BEGIN OPENSSH PRIVATE KEY-----` inclus) dans le secret `VPS_SSH_KEY`.

---

## Environnement GitHub `production`

Le job `deploy` dans `deploy.yml` utilise l'environnement `production` qui peut exiger une **approbation manuelle** avant exécution.

### Créer l'environnement

1. Aller dans **Settings → Environments → New environment**
2. Nommer l'environnement `production`
3. Activer **Required reviewers** (optionnel) pour valider avant déploiement
4. Activer **Deployment branches** → restreindre à `main`

---

## Déclencher un déploiement manuel

1. Aller sur l'onglet **Actions** du dépôt GitHub
2. Sélectionner le workflow **Deploy to Production**
3. Cliquer sur **Run workflow** → sélectionner la branche `main` → **Run workflow**

---

## Structure du déploiement sur le VPS

Le déploiement SSH effectue les étapes suivantes dans `/opt/gestmoney` :

```
git fetch origin main && git reset --hard origin/main
  └─ Récupère le dernier code sans merge commit

npx prisma migrate deploy
  └─ Applique les migrations en attente (non destructif)

docker compose -f docker-compose.prod.yml up -d --build api
docker compose -f docker-compose.prod.yml up -d --build web
  └─ Rebuild et redémarre uniquement les services applicatifs

docker image prune -f
  └─ Supprime les anciennes images pour libérer l'espace disque

curl -f http://localhost:3001/health
curl -f http://localhost:3000
  └─ Vérifie que les services répondent après redémarrage
```

---

## Vérifier l'état de santé de l'API

L'endpoint `/health` est disponible sans authentification :

```bash
curl https://gestmoney.ibigsoft.com/api/health
# {"status":"ok","service":"GESTMONEY API","version":"1.0.0","timestamp":"...","uptime":...}
```

---

## Backup base de données

Le workflow `backup.yml` se déclenche automatiquement chaque nuit à 01h UTC et appelle `/opt/gestmoney/scripts/backup-db.sh` sur le VPS.

Le script doit exister sur le VPS. Exemple minimal :

```bash
#!/bin/bash
set -e
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups/gestmoney
mkdir -p "$BACKUP_DIR"

docker compose -f /opt/gestmoney/docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  > "$BACKUP_DIR/gestmoney_$DATE.sql"

# Conserver uniquement les 30 derniers backups
ls -t "$BACKUP_DIR"/*.sql | tail -n +31 | xargs -r rm --

echo "Backup créé : $BACKUP_DIR/gestmoney_$DATE.sql"
```

Rendre le script exécutable :

```bash
chmod +x /opt/gestmoney/scripts/backup-db.sh
```
