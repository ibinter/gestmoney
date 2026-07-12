# GESTMONEY AI Service

Microservice Python FastAPI dédié à l'intelligence artificielle pour la plateforme **GESTMONEY** — gestion Cloud SaaS de réseaux d'agents Mobile Money en Afrique de l'Ouest.

## Fonctionnalités

- **Détection de fraude** : Isolation Forest (scikit-learn) + règles métier Mobile Money
- **Prévisions de float** : moyenne mobile 4 semaines + tendance linéaire, par agent et opérateur
- **Détection d'anomalies** : chutes de réseau, agents inactifs, écarts de caisse
- **Insights IA** : top agents, meilleures heures, comparaison opérateurs, recommandations personnalisées
- **Gestion du cold start** : démarre sans données, passe aux règles métier seules si pas de modèle ML

## Prérequis

- Python 3.11+
- PostgreSQL 14+ (partagé avec le backend NestJS)
- pip ou Docker

## Lancement en développement

```bash
# 1. Cloner / naviguer dans le dossier
cd apps/ai-service

# 2. Créer un environnement virtuel
python -m venv venv
source venv/bin/activate        # Linux/macOS
venv\Scripts\activate           # Windows

# 3. Installer les dépendances
pip install -r requirements.txt

# 4. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 5. Démarrer le serveur
python main.py
# ou directement :
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Le service démarre sur **http://localhost:8001**

- Documentation Swagger : http://localhost:8001/docs
- Documentation ReDoc : http://localhost:8001/redoc
- Health check : http://localhost:8001/health

## Lancement avec Docker

```bash
# Construire l'image
docker build -t gestmoney-ai-service .

# Démarrer le conteneur
docker run -d \
  --name gestmoney-ai \
  -p 8001:8001 \
  -e DATABASE_URL=postgresql://gestmoney:gestmoney@host.docker.internal:5432/gestmoney \
  -e NESTJS_URL=http://host.docker.internal:3000 \
  -v gestmoney-models:/app/models_saved \
  gestmoney-ai-service

# Vérifier le health check
curl http://localhost:8001/health
```

## Lancement avec docker-compose (recommandé)

Dans la racine du projet GESTMONEY, le service est déjà configuré dans `docker-compose.yml`.

```bash
docker-compose up ai-service
```

## Structure

```
apps/ai-service/
├── main.py                         # Point d'entrée FastAPI
├── requirements.txt
├── Dockerfile
├── .env.example
├── app/
│   ├── config.py                   # Variables d'environnement
│   ├── database.py                 # Connexion SQLAlchemy
│   ├── models/
│   │   ├── fraud_detector.py       # Isolation Forest + règles métier
│   │   ├── float_forecaster.py     # Prévision float (moyenne mobile)
│   │   ├── commission_optimizer.py # Analyse des performances commissions
│   │   └── anomaly_detector.py     # Détection anomalies réseau/agent/finance
│   ├── routers/
│   │   ├── fraud.py                # POST /fraud/analyze, /batch-analyze, ...
│   │   ├── forecast.py             # GET /forecast/float/{agent}/{op}, ...
│   │   ├── anomaly.py              # GET /anomaly/detect, /history, ...
│   │   └── insights.py             # GET /insights/top-agents, ...
│   ├── schemas/                    # Modèles Pydantic v2
│   │   ├── transaction.py
│   │   ├── fraud.py
│   │   ├── forecast.py
│   │   └── anomaly.py
│   └── services/                   # Logique métier
│       ├── fraud_service.py
│       ├── forecast_service.py
│       └── anomaly_service.py
```

## Endpoints principaux

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | /health | Health check |
| POST | /fraud/analyze | Analyser une transaction |
| POST | /fraud/batch-analyze | Analyser un lot (max 500) |
| GET | /fraud/alerts | Alertes fraude actives |
| POST | /fraud/alerts/{id}/resolve | Résoudre une alerte |
| GET | /fraud/stats | Statistiques fraude |
| POST | /fraud/train | Ré-entraîner le modèle ML |
| GET | /forecast/float/{agent_id}/{operator} | Prévision float 24h |
| GET | /forecast/float/{agent_id}/{operator}/replenishment | Besoin rechargement 7j |
| GET | /forecast/float/network/{network_id} | Prévision réseau agrégée |
| GET | /forecast/transactions/{agency_id} | Prévision volume transactions |
| GET | /forecast/revenue/{network_id} | Prévision revenus commissions |
| GET | /anomaly/detect | Anomalies actives |
| GET | /anomaly/history | Historique anomalies |
| POST | /anomaly/{id}/acknowledge | Acquitter une anomalie |
| GET | /insights/top-agents | Top 10 agents |
| GET | /insights/best-hours | Meilleures heures |
| GET | /insights/operator-comparison | Comparaison opérateurs |
| GET | /insights/recommendations | Recommandations IA |

## Entraîner le modèle ML

Par défaut, le service démarre sans modèle ML (mode règles métier uniquement).
Une fois des transactions en base, entraînez le modèle :

```bash
curl -X POST "http://localhost:8001/fraud/train?tenant_id=VOTRE_TENANT_ID"
```

Le modèle sera sauvegardé dans `MODEL_PATH` et chargé automatiquement au prochain démarrage.

## Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| DATABASE_URL | postgresql://... | URL PostgreSQL |
| API_SECRET | gestmoney-ai-secret-dev | Clé JWT inter-services |
| NESTJS_URL | http://localhost:3000 | URL du backend NestJS |
| MODEL_PATH | /app/models_saved | Répertoire des modèles ML |
| FRAUD_ALERT_THRESHOLD | 60 | Score minimum pour créer une alerte (0-100) |
| FLOAT_LOW_THRESHOLD | 50000 | Seuil float bas en XOF |
| MAX_CASH_DISCREPANCY | 10000 | Écart caisse toléré en XOF |
| ENVIRONMENT | development | Environnement d'exécution |
| DEBUG | true | Mode debug (logs verbeux) |
| PORT | 8001 | Port du serveur |
