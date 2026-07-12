"""
Configuration de la connexion SQLAlchemy à PostgreSQL.
Le service IA accède en lecture à la base principale et écrit
uniquement dans les tables d'alertes et d'anomalies.
"""
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# Moteur de connexion avec pool de connexions
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # Vérifie la connexion avant usage
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Générateur de session de base de données pour injection de dépendance FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Vérifie que la base de données est accessible au démarrage."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Connexion à la base de données établie avec succès.")
        return True
    except Exception as e:
        logger.warning(f"Base de données inaccessible : {e}. Le service démarre en mode dégradé.")
        return False
