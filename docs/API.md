# GESTMONEY — Documentation API

Base URL : `https://api.gestmoney.ci/v1`

Toutes les requêtes nécessitent le header :
```
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_slug>
Content-Type: application/json
```

---

## Authentification

### POST /auth/login

Authentification par email/mot de passe.

```bash
curl -X POST https://api.gestmoney.ci/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent1@demo.ci",
    "password": "Demo2026!"
  }'
```

**Réponse 200 :**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "clxxxxx",
      "email": "agent1@demo.ci",
      "firstName": "Kofi",
      "lastName": "Asante",
      "role": "AGENT"
    }
  }
}
```

**Erreurs :**
- `401` : Identifiants invalides
- `403` : Compte désactivé
- `429` : Trop de tentatives (rate limit)

---

### POST /auth/refresh

Renouvellement du token d'accès.

```bash
curl -X POST https://api.gestmoney.ci/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Réponse 200 :**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

---

### POST /auth/2fa/verify

Vérification du code 2FA (TOTP).

```bash
curl -X POST https://api.gestmoney.ci/v1/auth/2fa/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456"
  }'
```

---

### POST /auth/logout

Révocation du refresh token.

```bash
curl -X POST https://api.gestmoney.ci/v1/auth/logout \
  -H "Authorization: Bearer <token>"
```

---

## Transactions

### POST /transactions

Créer une nouvelle transaction Mobile Money.

```bash
curl -X POST https://api.gestmoney.ci/v1/transactions \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: ibig-demo" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "DEPOSIT",
    "amount": 25000,
    "currency": "XOF",
    "customerPhone": "+2250701234567",
    "operatorCode": "ORANGE_CI",
    "floatAccountId": "clxxxxx",
    "description": "Dépôt Mobile Money"
  }'
```

**Corps de la requête :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `type` | enum | Oui | `DEPOSIT`, `WITHDRAWAL`, `CASH_IN`, `CASH_OUT` |
| `amount` | number | Oui | Montant en XOF (min 500, max 1 000 000) |
| `currency` | string | Non | Devise (défaut: `XOF`) |
| `customerPhone` | string | Oui | Numéro du client au format E.164 |
| `operatorCode` | string | Oui | `ORANGE_CI`, `MTN_CI`, `WAVE_CI`, `MOOV_CI`, `AIRTEL_CI` |
| `floatAccountId` | string | Oui | ID du compte float de l'agent |
| `description` | string | Non | Libellé optionnel |

**Réponse 201 :**
```json
{
  "data": {
    "id": "clxxxxx",
    "reference": "TXN-1720601234-000001-4892",
    "type": "DEPOSIT",
    "status": "PENDING",
    "amount": 25000,
    "fees": 125,
    "currency": "XOF",
    "customerPhone": "+2250701234567",
    "operatorCode": "ORANGE_CI",
    "createdAt": "2026-07-10T10:30:00Z"
  }
}
```

---

### GET /transactions

Lister les transactions avec filtres et pagination.

```bash
curl "https://api.gestmoney.ci/v1/transactions?page=1&limit=20&type=DEPOSIT&status=COMPLETED&from=2026-07-01&to=2026-07-10" \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: ibig-demo"
```

**Paramètres de requête :**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `page` | number | Numéro de page (défaut: 1) |
| `limit` | number | Éléments par page (max: 100, défaut: 20) |
| `type` | enum | Filtre par type |
| `status` | enum | `PENDING`, `COMPLETED`, `FAILED`, `CANCELLED` |
| `operatorCode` | string | Filtre par opérateur |
| `agentId` | string | Filtre par agent |
| `from` | date | Date de début (ISO 8601) |
| `to` | date | Date de fin (ISO 8601) |
| `minAmount` | number | Montant minimum |
| `maxAmount` | number | Montant maximum |

**Réponse 200 :**
```json
{
  "data": [...],
  "meta": {
    "total": 1250,
    "page": 1,
    "limit": 20,
    "totalPages": 63
  }
}
```

---

### GET /transactions/:id

Détail d'une transaction.

```bash
curl https://api.gestmoney.ci/v1/transactions/clxxxxx \
  -H "Authorization: Bearer <token>"
```

---

### PATCH /transactions/:id/cancel

Annuler une transaction (statut PENDING uniquement).

```bash
curl -X PATCH https://api.gestmoney.ci/v1/transactions/clxxxxx/cancel \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Erreur de saisie du numéro client"
  }'
```

---

### GET /transactions/stats

Statistiques agrégées des transactions.

```bash
curl "https://api.gestmoney.ci/v1/transactions/stats?period=month&agencyId=clxxxxx" \
  -H "Authorization: Bearer <token>"
```

**Réponse 200 :**
```json
{
  "data": {
    "totalTransactions": 4820,
    "totalVolume": 145820000,
    "totalFees": 729100,
    "byType": {
      "DEPOSIT": { "count": 2892, "volume": 87492000 },
      "WITHDRAWAL": { "count": 1205, "volume": 48380000 }
    },
    "byStatus": {
      "COMPLETED": 4579,
      "FAILED": 144,
      "CANCELLED": 97
    },
    "dailyTrend": [...]
  }
}
```

---

## Float

### GET /float/accounts

Liste des comptes float de l'agent connecté.

```bash
curl https://api.gestmoney.ci/v1/float/accounts \
  -H "Authorization: Bearer <token>"
```

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "clxxxxx",
      "operatorCode": "ORANGE_CI",
      "operatorName": "Orange Money CI",
      "accountNumber": "ORANGE_CI-AGT-PLT-001-123456",
      "balance": 752000,
      "currency": "XOF",
      "minBalance": 50000,
      "status": "ACTIVE",
      "lastSyncAt": "2026-07-10T09:45:00Z"
    }
  ]
}
```

---

### GET /float/accounts/:id/balance

Solde en temps réel d'un compte float (interroge l'API opérateur).

```bash
curl https://api.gestmoney.ci/v1/float/accounts/clxxxxx/balance \
  -H "Authorization: Bearer <token>"
```

---

### POST /float/replenish

Demande de réapprovisionnement de float.

```bash
curl -X POST https://api.gestmoney.ci/v1/float/replenish \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "floatAccountId": "clxxxxx",
    "requestedAmount": 500000,
    "urgency": "NORMAL",
    "note": "Stock bas prévu pour journée chargée"
  }'
```

---

### GET /float/alerts

Alertes de float faible pour le tenant.

```bash
curl "https://api.gestmoney.ci/v1/float/alerts?resolved=false" \
  -H "Authorization: Bearer <token>"
```

---

## Commissions

### GET /commissions

Lister les commissions gagnées.

```bash
curl "https://api.gestmoney.ci/v1/commissions?period=2026-07&agentId=clxxxxx" \
  -H "Authorization: Bearer <token>"
```

---

### POST /commissions/calculate

Calculer la commission pour une transaction (simulation).

```bash
curl -X POST https://api.gestmoney.ci/v1/commissions/calculate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionType": "DEPOSIT",
    "amount": 50000,
    "operatorCode": "ORANGE_CI",
    "agentId": "clxxxxx"
  }'
```

**Réponse 200 :**
```json
{
  "data": {
    "grossCommission": 250,
    "networkShare": 75,
    "agencyShare": 50,
    "agentShare": 125,
    "planName": "Barème Standard CI",
    "breakdown": {
      "rate": "0.5%",
      "minAmount": 500,
      "tier": "STANDARD"
    }
  }
}
```

---

### POST /commissions/validate

Valider le paiement des commissions d'une période (rôle ACCOUNTANT+).

```bash
curl -X POST https://api.gestmoney.ci/v1/commissions/validate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "period": "2026-06",
    "agentIds": ["clxxxxx", "clyyyyy"],
    "validateAll": false
  }'
```

---

## Codes d'erreur

| Code HTTP | Code métier | Description |
|-----------|-------------|-------------|
| 400 | `VALIDATION_ERROR` | Données invalides |
| 401 | `UNAUTHORIZED` | Token manquant ou expiré |
| 403 | `FORBIDDEN` | Permission insuffisante |
| 404 | `NOT_FOUND` | Ressource introuvable |
| 409 | `CONFLICT` | Conflit (ex: doublon) |
| 422 | `INSUFFICIENT_FLOAT` | Solde float insuffisant |
| 422 | `DAILY_LIMIT_EXCEEDED` | Limite journalière dépassée |
| 429 | `RATE_LIMIT` | Trop de requêtes |
| 503 | `OPERATOR_UNAVAILABLE` | Opérateur Mobile Money indisponible |

**Format d'erreur standard :**
```json
{
  "statusCode": 422,
  "error": "INSUFFICIENT_FLOAT",
  "message": "Solde float insuffisant pour cette transaction",
  "details": {
    "currentBalance": 12000,
    "requiredAmount": 50000,
    "deficit": 38000
  },
  "timestamp": "2026-07-10T10:30:00Z",
  "path": "/v1/transactions"
}
```
