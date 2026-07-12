# GESTMONEY — Guide de déploiement

## Prérequis

### Serveur VPS recommandé
- **OS** : Ubuntu 22.04 LTS
- **RAM** : 4 Go minimum (8 Go recommandé en production)
- **CPU** : 2 vCPU minimum
- **Stockage** : 40 Go SSD minimum
- **Réseau** : IPv4 statique, ports 80 et 443 ouverts

### Logiciels requis

```bash
# Docker 24+
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Docker Compose plugin
sudo apt-get install docker-compose-plugin

# Node.js 20 (pour les outils CLI uniquement)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm 9
npm install -g pnpm@9

# Python 3.11 (pour le service IA)
sudo apt-get install -y python3.11 python3.11-venv python3-pip
```

---

## Variables d'environnement

Créer `/opt/gestmoney/.env` à partir de `.env.example` :

```bash
cp .env.example .env
nano .env
```

### Variables obligatoires

```env
# ─── Application ──────────────────────────────────────
NODE_ENV=production
APP_PORT=3001
FRONTEND_URL=https://app.gestmoney.ci

# ─── Base de données ──────────────────────────────────
DATABASE_URL=postgresql://gestmoney:CHANGE_ME@postgres:5432/gestmoney_prod
POSTGRES_USER=gestmoney
POSTGRES_PASSWORD=CHANGE_ME         # Minimum 32 caractères
POSTGRES_DB=gestmoney_prod

# ─── Redis ────────────────────────────────────────────
REDIS_URL=redis://redis:6379

# ─── JWT ──────────────────────────────────────────────
# Générer : node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=CHANGE_ME_64_CHARS_MINIMUM
JWT_REFRESH_SECRET=CHANGE_ME_64_CHARS_MINIMUM_DIFFERENT
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ─── Email ────────────────────────────────────────────
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.CHANGE_ME
MAIL_FROM=noreply@gestmoney.ci

# ─── SMS ──────────────────────────────────────────────
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACCHANGE_ME
TWILIO_AUTH_TOKEN=CHANGE_ME
TWILIO_FROM=+225XXXXXXXXXX

# ─── Stockage objet ───────────────────────────────────
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=gestmoney-prod
S3_ACCESS_KEY=CHANGE_ME
S3_SECRET_KEY=CHANGE_ME
S3_REGION=eu-west-1

# ─── Service IA ───────────────────────────────────────
AI_SERVICE_URL=http://ai-service:8000
AI_SERVICE_API_KEY=CHANGE_ME_32_CHARS

# ─── Monitoring ───────────────────────────────────────
SENTRY_DSN=https://CHANGE_ME@sentry.io/PROJECT_ID

# ─── Docker images ────────────────────────────────────
IMAGE_TAG=latest
REGISTRY=ghcr.io/ibig-soft
```

---

## Procédure de déploiement — VPS Ubuntu 22.04

### 1. Préparation du serveur

```bash
# Mise à jour du système
sudo apt-get update && sudo apt-get upgrade -y

# Création de l'utilisateur de déploiement
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy

# Répertoire de l'application
sudo mkdir -p /opt/gestmoney
sudo mkdir -p /backups/gestmoney
sudo chown deploy:deploy /opt/gestmoney /backups/gestmoney

# Clé SSH pour le déploiement CI/CD
sudo -u deploy bash -c "
  mkdir -p ~/.ssh
  echo 'VOTRE_CLE_PUBLIQUE_DEPLOY' >> ~/.ssh/authorized_keys
  chmod 600 ~/.ssh/authorized_keys
"
```

### 2. Configuration initiale

```bash
# Se connecter en tant que deploy
su - deploy
cd /opt/gestmoney

# Cloner le dépôt (ou copier les fichiers)
git clone https://github.com/ibig-soft/gestmoney.git .

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec les vraies valeurs

# Connexion au GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Premier démarrage
docker compose pull
docker compose up -d

# Migrations de base de données
docker compose run --rm api npx prisma migrate deploy

# Seed données (première fois uniquement)
pnpm db:seed
```

### 3. Vérification

```bash
# Vérifier que les conteneurs tournent
docker compose ps

# Logs de l'API
docker compose logs api --tail=50

# Vérifier l'endpoint de santé
curl http://localhost:3001/health
```

---

## Configuration Nginx

### Installation

```bash
sudo apt-get install -y nginx
```

### Configuration `/etc/nginx/sites-available/gestmoney`

```nginx
# Redirection HTTP → HTTPS
server {
    listen 80;
    server_name app.gestmoney.ci api.gestmoney.ci;
    return 301 https://$host$request_uri;
}

# Frontend Next.js
server {
    listen 443 ssl http2;
    server_name app.gestmoney.ci;

    ssl_certificate /etc/letsencrypt/live/gestmoney.ci/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gestmoney.ci/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Sécurité HTTP headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# API NestJS
server {
    listen 443 ssl http2;
    server_name api.gestmoney.ci;

    ssl_certificate /etc/letsencrypt/live/gestmoney.ci/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gestmoney.ci/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req zone=api burst=20 nodelay;

    # Taille maximale des requêtes
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts pour les opérations longues
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # WebSocket pour les notifications temps réel
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

```bash
# Activer la configuration
sudo ln -s /etc/nginx/sites-available/gestmoney /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL avec Let's Encrypt

```bash
# Installation de Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtenir les certificats
sudo certbot --nginx -d app.gestmoney.ci -d api.gestmoney.ci \
  --email devops@gestmoney.ci --agree-tos --non-interactive

# Renouvellement automatique (via cron, déjà configuré par certbot)
sudo certbot renew --dry-run
```

---

## Monitoring avec Prometheus + Grafana

### `docker/docker-compose.monitoring.yml`

```yaml
version: "3.8"
services:
  prometheus:
    image: prom/prometheus:v2.47.0
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "127.0.0.1:9090:9090"

  grafana:
    image: grafana/grafana:10.2.0
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: CHANGE_ME
      GF_SERVER_ROOT_URL: https://monitoring.gestmoney.ci
    ports:
      - "127.0.0.1:3002:3000"

  loki:
    image: grafana/loki:2.9.0
    ports:
      - "127.0.0.1:3100:3100"

volumes:
  prometheus_data:
  grafana_data:
```

### Accès à Grafana

Configurer Nginx pour exposer Grafana sur `monitoring.gestmoney.ci` (accès restreint par IP ou VPN).

Dashboards recommandés à importer :
- Node.js Application Dashboard (ID: 11159)
- PostgreSQL Database (ID: 9628)
- Redis Dashboard (ID: 763)

---

## Backup PostgreSQL automatique

### Script `/opt/gestmoney/scripts/backup.sh`

```bash
#!/bin/bash
set -e

BACKUP_DIR="/backups/gestmoney"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
DB_NAME="gestmoney_prod"
CONTAINER="gestmoney-postgres-1"

# Créer le backup
docker exec $CONTAINER pg_dump \
  -U $POSTGRES_USER \
  -Fc $DB_NAME \
  > "$BACKUP_DIR/gestmoney_$DATE.dump"

# Compresser
gzip "$BACKUP_DIR/gestmoney_$DATE.dump"

# Supprimer les anciens backups
find "$BACKUP_DIR" -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: gestmoney_$DATE.dump.gz"

# Optionnel : envoyer sur S3
# aws s3 cp "$BACKUP_DIR/gestmoney_$DATE.dump.gz" s3://gestmoney-backups/
```

### Cron quotidien

```bash
sudo crontab -e
# Ajouter :
0 2 * * * /opt/gestmoney/scripts/backup.sh >> /var/log/gestmoney-backup.log 2>&1
```

---

## Mise à jour en production

```bash
# Se connecter en tant que deploy
su - deploy
cd /opt/gestmoney

# Pull des nouvelles images
docker compose pull

# Migrations (si nécessaire)
docker compose run --rm api npx prisma migrate deploy

# Redémarrage
docker compose up -d --remove-orphans

# Vérification
docker compose ps
curl https://api.gestmoney.ci/health
```

---

## Rollback d'urgence

```bash
# Revenir à l'image précédente (remplacer TAG)
export IMAGE_TAG=v1.2.3
docker compose up -d

# Ou restaurer la base de données
docker exec -i gestmoney-postgres-1 pg_restore \
  -U gestmoney \
  -d gestmoney_prod \
  -Fc /backups/gestmoney/gestmoney_BACKUP_TAG.dump.gz
```
