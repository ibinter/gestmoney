# Checklist deploiement GESTMONEY

**Version** : 1.0.0 | **Date** : Juillet 2026 | **Domaine** : gestmoney.ibigsoft.com

---

## Pre-deploiement (base de donnees)

- [ ] PostgreSQL 15 en cours sur le VPS (verifier `docker ps`)
- [ ] 3 migrations Prisma appliquees : `npx prisma migrate deploy`
  - `20260722010000_ticket_message_piece_jointe`
  - `20260722020000_customer_kyc_flow`
  - `20260726010000_sara_categorie_question`
- [ ] Seed initial lance : `pnpm db:seed`
- [ ] Seed demo optionnel : `SEED_DEMO=true pnpm db:seed`

## Pre-deploiement (dependances)

- [ ] `pnpm add xlsx --filter @gestmoney/api` execute (import Excel)
- [ ] `pnpm install` relance a la racine apres ajout

## Variables d'environnement VPS

- [ ] `DATABASE_URL` — pointe vers le PostgreSQL de production
- [ ] `JWT_SECRET` — chaine aleatoire >= 64 caracteres
- [ ] `JWT_REFRESH_SECRET` — chaine aleatoire differente >= 64 caracteres
- [ ] `JWT_EXPIRES_IN=15m`
- [ ] `JWT_REFRESH_EXPIRES_IN=7d`
- [ ] `SMTP_HOST=ssl0.ovh.net`
- [ ] `SMTP_PORT=465`
- [ ] `SMTP_USER=gestmoney@ibigsoft.com`
- [ ] `SMTP_PASS` — mot de passe LWS (ne pas commiter)
- [ ] `SMTP_FROM=GESTMONEY <gestmoney@ibigsoft.com>`
- [ ] `API_URL=https://gestmoney.ibigsoft.com/api`
- [ ] `APP_URL=https://gestmoney.ibigsoft.com`
- [ ] `NODE_ENV=production`

## Secrets GitHub Actions

- [ ] `VPS_SSH_KEY` — cle privee SSH pour 185.98.139.38
- [ ] `NEXT_PUBLIC_API_URL=https://gestmoney.ibigsoft.com/api`
- [ ] `NEXT_PUBLIC_APP_URL=https://gestmoney.ibigsoft.com`
- [ ] `DATABASE_URL` — URL PostgreSQL production
- [ ] `JWT_SECRET`
- [ ] `JWT_REFRESH_SECRET`
- [ ] `SMTP_PASS`
- [ ] Environnement GitHub **"production"** cree avec protection de branche sur `main`

## Infrastructure reseau

- [ ] DNS `gestmoney.ibigsoft.com` pointe vers `185.98.139.38`
- [ ] Certificat SSL actif et valide (HTTPS, HSTS)
- [ ] Ports `80` et `443` ouverts sur le pare-feu VPS
- [ ] Port `5432` PostgreSQL ferme a l'externe

## Build & demarrage

- [ ] Images Docker buildees avec les `NEXT_PUBLIC_*` en `--build-arg`
- [ ] `docker compose -f docker/docker-compose.yml up -d` sans erreur
- [ ] Logs API sans erreur critique : `docker compose logs api`
- [ ] Logs Web sans erreur critique : `docker compose logs web`

---

## Validation fonctionnelle post-deploiement

### Authentification

- [ ] Login `admin@gestmoney.ibigsoft.com` / `Gestmoney@2026` reussi
- [ ] Mot de passe admin change immediatement apres premier login
- [ ] Refresh token fonctionne (session persistante apres 15 min)
- [ ] 2FA TOTP activable depuis le profil

### Email

- [ ] Email de bienvenue recu lors d'une inscription test
- [ ] Email de reset password fonctionne
- [ ] Expediteur affiche : `GESTMONEY <gestmoney@ibigsoft.com>`

### Transactions

- [ ] Creation d'une transaction test depot (type, montant, agent)
- [ ] Transaction apparait dans la liste avec les bons filtres
- [ ] Export PDF d'une transaction telechargeable
- [ ] Export CSV de la liste fonctionne

### Dashboard

- [ ] KPIs affiches correctement sur la page d'accueil dashboard
- [ ] Graphiques Recharts charges sans erreur
- [ ] Pages agences, operateurs, clients accessibles
- [ ] Page profil edition fonctionnelle

### Assistant SARA

- [ ] SARA repond sur la page landing (endpoint public)
- [ ] SARA repond sur le dashboard (endpoint prive, authentifie)

### Verification documents

- [ ] Page `/verify/[token]` s'affiche sans erreur 500

### PWA

- [ ] Manifest charge : `https://gestmoney.ibigsoft.com/manifest.json`
- [ ] Page offline accessible en mode hors-ligne
- [ ] Banniere d'installation PWA visible sur mobile

### Backup

- [ ] Workflow GitHub Actions `backup.yml` configure et teste
- [ ] Backup nocturne programme verifie

---

## Tests de charge recommandes (avant ouverture)

| Scenario | Charge cible |
|---|---|
| Connexions simultanees dashboard | 50 utilisateurs |
| Transactions en pic | 100 transactions/minute |
| Export PDF simultane | 10 exports paralleles |
| Appels API SARA | 20 requetes/minute |

Outil suggere : `k6` ou `Artillery` depuis un serveur externe.

---

## Contacts en cas d'incident

- Technique IBIG Soft : gestmoney@ibigsoft.com
- Tel : +225 27 22 27 60 14
- VPS : 185.98.139.38 (acces SSH root)

---

*Checklist GESTMONEY v1.0.0 — IBIG Soft — Juillet 2026*
