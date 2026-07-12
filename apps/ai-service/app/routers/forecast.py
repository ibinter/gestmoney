"""
Routeur FastAPI pour les prévisions de float et de transactions.
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.forecast import (
    ForecastResult,
    NetworkForecastResult,
    ReplenishmentForecast,
    RevenueForecast,
    TransactionVolumeForecast,
)
from app.services.forecast_service import (
    forecast_agent_float_24h,
    forecast_network_float,
    forecast_transaction_volume,
    forecast_revenue,
)
from app.models.float_forecaster import float_forecaster

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/forecast", tags=["Prévisions"])


@router.get(
    "/float/{agent_id}/{operator}",
    response_model=ForecastResult,
    summary="Prévision float 24h pour un agent",
    description="Prévoit le float nécessaire heure par heure pour les 24 prochaines heures.",
)
async def get_agent_float_forecast(
    agent_id: str,
    operator: str,
    historique_jours: int = Query(28, ge=7, le=365),
    db: Session = Depends(get_db),
) -> ForecastResult:
    return await forecast_agent_float_24h(agent_id, operator, db, historique_jours)


@router.get(
    "/float/{agent_id}/{operator}/replenishment",
    response_model=ReplenishmentForecast,
    summary="Prévision de rechargement float sur 7 jours",
)
async def get_replenishment_forecast(
    agent_id: str,
    operator: str,
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
) -> ReplenishmentForecast:
    """Estime le besoin de rechargement float pour les N prochains jours."""
    historique: list[dict] = []

    if db is not None:
        try:
            from sqlalchemy import text
            rows = db.execute(text("""
                SELECT
                    DATE(date_transaction) AS date,
                    EXTRACT(HOUR FROM date_transaction) AS heure,
                    SUM(CASE WHEN type_transaction = 'DEPOT' THEN montant ELSE -montant END) AS montant_cumul_float
                FROM transactions
                WHERE agent_id = :agent_id AND operateur = :operator
                  AND date_transaction >= NOW() - INTERVAL '28 days'
                GROUP BY 1, 2
                ORDER BY 1, 2
            """), {"agent_id": agent_id, "operator": operator}).fetchall()
            historique = [dict(row._mapping) for row in rows]
        except Exception as e:
            logger.warning(f"Erreur récupération historique replenishment : {e}")

    result = float_forecaster.forecast_replenishment_need(agent_id, operator, historique, days)
    return ReplenishmentForecast(**result)


@router.get(
    "/float/network/{network_id}",
    response_model=NetworkForecastResult,
    summary="Prévision agrégée de float pour tout le réseau",
)
async def get_network_float_forecast(
    network_id: str,
    db: Session = Depends(get_db),
) -> NetworkForecastResult:
    """Agrège les prévisions de float de tous les agents actifs du réseau."""
    agents: list[str] = []
    operators: list[str] = []

    if db is not None:
        try:
            from sqlalchemy import text
            rows = db.execute(text("""
                SELECT DISTINCT a.id AS agent_id, t.operateur
                FROM agents a
                JOIN transactions t ON t.agent_id = a.id
                WHERE a.network_id = :network_id AND a.actif = TRUE
                  AND t.date_transaction >= NOW() - INTERVAL '7 days'
                LIMIT 100
            """), {"network_id": network_id}).fetchall()
            agents = list({str(r.agent_id) for r in rows})
            operators = list({str(r.operateur) for r in rows})
        except Exception as e:
            logger.warning(f"Erreur récupération agents réseau {network_id} : {e}")

    if not agents:
        return NetworkForecastResult(
            network_id=network_id,
            nb_agents=0,
            previsions_agregees={},
            agents_en_alerte=[],
            confiance_moyenne=0.0,
        )

    return await forecast_network_float(network_id, agents, operators, db)


@router.get(
    "/transactions/{agency_id}",
    response_model=TransactionVolumeForecast,
    summary="Prévision du volume de transactions par agence",
)
async def get_transaction_volume_forecast(
    agency_id: str,
    db: Session = Depends(get_db),
) -> TransactionVolumeForecast:
    """Prévoit le volume et le montant des transactions heure par heure pour une agence."""
    return await forecast_transaction_volume(agency_id, db)


@router.get(
    "/revenue/{network_id}",
    response_model=RevenueForecast,
    summary="Prévision des revenus en commissions sur 7 jours",
)
async def get_revenue_forecast(
    network_id: str,
    db: Session = Depends(get_db),
) -> RevenueForecast:
    """Prévoit les revenus en commissions Mobile Money pour les 7 prochains jours."""
    return await forecast_revenue(network_id, db)
