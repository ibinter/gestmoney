"""
Configuration de l'application AI Service GESTMONEY.
Charge les variables d'environnement nécessaires au fonctionnement du service.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Paramètres de configuration du service IA."""

    # Base de données PostgreSQL partagée avec le backend NestJS
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://gestmoney:gestmoney@localhost:5432/gestmoney"
    )

    # Clé secrète pour signer les tokens JWT inter-services
    API_SECRET: str = os.getenv("API_SECRET", "gestmoney-ai-secret-dev")

    # URL du backend NestJS pour les callbacks et webhooks
    NESTJS_URL: str = os.getenv("NESTJS_URL", "http://localhost:3000")

    # Répertoire de sauvegarde des modèles ML sérialisés
    MODEL_PATH: str = os.getenv("MODEL_PATH", "/app/models_saved")

    # Seuil de score à partir duquel une alerte fraude est créée en base
    FRAUD_ALERT_THRESHOLD: int = int(os.getenv("FRAUD_ALERT_THRESHOLD", "60"))

    # Environnement d'exécution
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # Port du serveur uvicorn
    PORT: int = int(os.getenv("PORT", "8001"))

    # Seuil de float minimum en XOF avant alerte de rechargement
    FLOAT_LOW_THRESHOLD: float = float(os.getenv("FLOAT_LOW_THRESHOLD", "50000"))

    # Écart caisse maximum toléré avant anomalie financière (XOF)
    MAX_CASH_DISCREPANCY: float = float(os.getenv("MAX_CASH_DISCREPANCY", "10000"))


settings = Settings()
