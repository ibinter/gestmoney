# Secrets GitHub Actions — GESTMONEY

Ce fichier liste toutes les variables secrètes à configurer dans GitHub.
**Ne jamais commiter de valeurs réelles ici.**

## Configuration

Accéder à : `Settings → Secrets and variables → Actions`

---

## Secrets globaux (Repository secrets)

| Nom | Description | Exemple de valeur |
|-----|-------------|-------------------|
| `GITHUB_TOKEN` | Token GitHub auto-généré | *(automatique)* |
| `SLACK_WEBHOOK_URL` | URL Webhook Slack pour notifications | `https://hooks.slack.com/services/T.../B.../...` |

---

## Environnement : `staging`

Créer via `Settings → Environments → New environment → staging`

| Nom | Description |
|-----|-------------|
| `STAGING_HOST` | IP ou hostname du VPS staging |
| `STAGING_USER` | Utilisateur SSH (ex: `deploy`) |
| `STAGING_SSH_KEY` | Clé SSH privée (contenu du fichier `~/.ssh/id_ed25519`) |
| `STAGING_PORT` | Port SSH (défaut: `22`) |
| `STAGING_API_URL` | URL publique de l'API staging (ex: `https://api-staging.gestmoney.ci`) |
| `STAGING_WEB_URL` | URL publique du frontend staging |

---

## Environnement : `production`

Créer via `Settings → Environments → New environment → production`
Activer **Required reviewers** et ajouter les personnes autorisées.

| Nom | Description |
|-----|-------------|
| `PROD_HOST` | IP ou hostname du VPS production |
| `PROD_USER` | Utilisateur SSH production |
| `PROD_SSH_KEY` | Clé SSH privée production (différente du staging) |
| `PROD_PORT` | Port SSH production |
| `PROD_API_URL` | URL publique de l'API production (ex: `https://api.gestmoney.ci`) |
| `PROD_WEB_URL` | URL publique du frontend production (ex: `https://app.gestmoney.ci`) |

---

## Variables d'environnement sur le VPS

Ces variables doivent être dans `/opt/gestmoney/.env` sur le serveur :

```env
# Base de données
DATABASE_URL=postgresql://gestmoney:PASSWORD@localhost:5432/gestmoney_prod
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=<chaîne aléatoire 64 caractères minimum>
JWT_REFRESH_SECRET=<chaîne aléatoire 64 caractères minimum>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://app.gestmoney.ci

# Email (SendGrid ou SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<SendGrid API Key>
MAIL_FROM=noreply@gestmoney.ci

# SMS (Twilio ou opérateur local)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=<SID>
TWILIO_AUTH_TOKEN=<Token>
TWILIO_FROM=+225XXXXXXXXXX

# Storage (S3 ou compatible)
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=gestmoney-prod
S3_ACCESS_KEY=<Access Key>
S3_SECRET_KEY=<Secret Key>
S3_REGION=eu-west-1

# IA Service
AI_SERVICE_URL=http://ai-service:8000
AI_SERVICE_API_KEY=<clé interne>

# Monitoring
SENTRY_DSN=<DSN Sentry>
```

---

## Génération de clés sécurisées

```bash
# Générer un secret JWT
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Générer une clé SSH pour le déploiement
ssh-keygen -t ed25519 -C "gestmoney-deploy" -f ~/.ssh/gestmoney_deploy
# Ajouter la clé publique dans ~/.ssh/authorized_keys sur le VPS
# Mettre la clé privée dans le secret GitHub PROD_SSH_KEY / STAGING_SSH_KEY
```
