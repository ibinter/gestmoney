# ──────────────────────────────────────────────────────────────────────────────
# GESTMONEY AI Service — Dockerfile multi-stage
# Image Python 3.11-slim, uvicorn sur le port 8001
# ──────────────────────────────────────────────────────────────────────────────

# ─── Étape 1 : builder — installation des dépendances ───────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Installation des outils de build (nécessaires pour psycopg2 et numpy)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copie et installation des dépendances dans un dossier isolé
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --prefix=/install --no-cache-dir -r requirements.txt


# ─── Étape 2 : image finale légère ──────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Dépendances runtime uniquement (pas les outils de build)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copie des packages installés à l'étape builder
COPY --from=builder /install /usr/local

# Copie du code source de l'application
COPY . .

# Dossier de sauvegarde des modèles ML (persisté via volume Docker)
RUN mkdir -p /app/models_saved

# Utilisateur non-root pour la sécurité
RUN addgroup --system aigroup && adduser --system --ingroup aigroup aiuser
RUN chown -R aiuser:aigroup /app
USER aiuser

# Variables d'environnement par défaut (surchargées par docker-compose ou Kubernetes)
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8001 \
    ENVIRONMENT=production \
    DEBUG=false \
    MODEL_PATH=/app/models_saved

EXPOSE 8001

# Health check Docker intégré
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8001/health').raise_for_status()"

# Démarrage avec uvicorn (workers en production, reload en dev)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
