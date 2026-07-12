"""
Point d'entrée du microservice IA GESTMONEY.
Service Python FastAPI dédié à la détection de fraudes et aux prévisions Mobile Money.
Opérateurs supportés : MTN, Orange, Moov, Wave, Airtel, Free, Togocel.
"""
import logging
import time
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import check_db_connection
from app.models.fraud_detector import fraud_detector
from app.routers import anomaly, forecast, fraud, insights

# ──────────────────────────────────────────────
# Configuration du logging
# ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("gestmoney.ai")


# ──────────────────────────────────────────────
# Lifecycle : initialisation au démarrage
# ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Initialise le service au démarrage :
    1. Vérifie la connexion à la base de données
    2. Tente de charger le modèle ML pré-entraîné
    3. Démarre en mode dégradé (règles métier seules) si aucun modèle n'est disponible
    """
    logger.info("=" * 60)
    logger.info("  GESTMONEY AI Service — démarrage")
    logger.info(f"  Environnement : {settings.ENVIRONMENT}")
    logger.info(f"  Backend NestJS : {settings.NESTJS_URL}")
    logger.info("=" * 60)

    # Connexion DB (non bloquante en cas d'échec)
    db_ok = check_db_connection()
    if not db_ok:
        logger.warning(
            "Base de données inaccessible. Le service démarre en mode dégradé : "
            "seules les règles métier seront actives."
        )

    # Chargement du modèle ML (cold start géré si absent)
    model_loaded = fraud_detector.load_model(settings.MODEL_PATH)
    if model_loaded:
        logger.info("Modèle Isolation Forest chargé. Détection ML activée.")
    else:
        logger.info(
            "Aucun modèle pré-entraîné. Détection basée sur les règles métier uniquement. "
            "Utilisez POST /fraud/train pour entraîner le modèle."
        )

    logger.info("Service IA opérationnel sur le port %d", settings.PORT)
    yield

    # Arrêt propre
    logger.info("Arrêt du service IA GESTMONEY.")


# ──────────────────────────────────────────────
# Application FastAPI
# ──────────────────────────────────────────────
app = FastAPI(
    title="GESTMONEY AI Service",
    description=(
        "Microservice IA pour la plateforme GESTMONEY — "
        "Détection de fraude Mobile Money, prévisions de float, "
        "détection d'anomalies et insights pour les réseaux d'agents en Afrique."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ──────────────────────────────────────────────
# CORS — autorise le backend NestJS et les dashboards
# ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.NESTJS_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:4200",   # Angular dashboard
        "http://localhost:5173",   # Vite / React dashboard
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Middleware de logging des requêtes
# ──────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next) -> Response:
    """Journalise chaque requête HTTP avec sa durée de traitement."""
    debut = time.time()
    response: Response = await call_next(request)
    duree_ms = (time.time() - debut) * 1000

    logger.info(
        "%s %s → %d (%.1f ms)",
        request.method,
        request.url.path,
        response.status_code,
        duree_ms,
    )
    return response


# ──────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────
app.include_router(fraud.router)
app.include_router(forecast.router)
app.include_router(anomaly.router)
app.include_router(insights.router)


@app.get("/health", tags=["Système"], summary="Health check")
async def health_check() -> dict:
    """
    Vérifie l'état de santé du service.
    Utilisé par le load balancer et les orchestrateurs (Docker, Kubernetes).
    """
    db_ok = check_db_connection()
    return {
        "status": "ok",
        "service": "gestmoney-ai",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "database": "connected" if db_ok else "degraded",
        "ml_model": "loaded" if fraud_detector.is_trained else "rules_only",
    }


@app.get("/", tags=["Système"], include_in_schema=False)
async def root() -> dict:
    return {
        "message": "GESTMONEY AI Service opérationnel",
        "docs": "/docs",
        "health": "/health",
    }


# ──────────────────────────────────────────────
# Point d'entrée CLI
# ──────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )
