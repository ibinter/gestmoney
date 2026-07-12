"""
Service de prévision des besoins en float et du volume de transactions.
Orchestre les appels aux modèles ML et la récupération des données historiques.
"""
import logging
from datetime import datetime, timedelta
from typing import Any

from app.models.float_forecaster import float_forecaster
from app.schemas.forecast import (
    ForecastResult,
    NetworkForecastResult,
    ReplenishmentForecast,
    RevenueForecast,
    TransactionVolumeForecast,
)

logger = logging.getLogger(__name__)


async def _fetch_agent_history(agent_id: str, operator: str, jours: int, db) -> list[dict]:
    """
    Récupère l'historique des soldes de float d'un agent depuis la base de données.
    Retourne une liste vide si la base est inaccessible (cold start géré par le modèle).
    """
    if db is None:
        return []

    try:
        from sqlalchemy import text
        result = db.execute(text("""
            SELECT
                DATE_TRUNC('hour', date_transaction) AS date_heure,
                EXTRACT(HOUR FROM date_transaction) AS heure,
                DATE(date_transaction) AS date,
                SUM(CASE WHEN type_transaction = 'DEPOT' THEN montant ELSE -montant END) AS montant_cumul_float
            FROM transactions
            WHERE agent_id = :agent_id
              AND operateur = :operator
              AND date_transaction >= NOW() - INTERVAL ':jours days'
            GROUP BY 1, 2, 3
            ORDER BY 1
        """), {"agent_id": agent_id, "operator": operator, "jours": jours}).fetchall()

        return [dict(row._mapping) for row in result]
    except Exception as e:
        logger.warning(f"Impossible de récupérer l'historique float pour {agent_id}/{operator} : {e}")
        return []


async def forecast_agent_float_24h(
    agent_id: str,
    operator: str,
    db=None,
    historique_jours: int = 28,
) -> ForecastResult:
    """Prévoit le float nécessaire heure par heure pour les 24 prochaines heures."""
    historique = await _fetch_agent_history(agent_id, operator, historique_jours, db)

    result = float_forecaster.forecast_next_24h(
        agent_id=agent_id,
        operator=operator,
        historical_data=historique,
    )

    return ForecastResult(
        agent_id=agent_id,
        operator=operator,
        previsions=result["previsions"],
        alertes=result["alertes"],
        confiance=result["confiance"],
        nb_points_historique=result["nb_points_historique"],
    )


async def forecast_network_float(
    network_id: str,
    agents: list[str],
    operators: list[str],
    db=None,
) -> NetworkForecastResult:
    """
    Agrège les prévisions de float de tous les agents d'un réseau.
    """
    previsions_agregees: dict[str, float] = {}
    agents_en_alerte: list[str] = []
    confidences: list[float] = []

    for agent_id in agents:
        for operator in operators:
            historique = await _fetch_agent_history(agent_id, operator, 28, db)
            result = float_forecaster.forecast_next_24h(agent_id, operator, historique)

            for heure_label, valeur in result["previsions"].items():
                previsions_agregees[heure_label] = (
                    previsions_agregees.get(heure_label, 0) + valeur
                )

            if result["alertes"]:
                agents_en_alerte.append(agent_id)

            confidences.append(result["confiance"])

    confiance_moyenne = sum(confidences) / len(confidences) if confidences else 0.0

    return NetworkForecastResult(
        network_id=network_id,
        nb_agents=len(agents),
        previsions_agregees=previsions_agregees,
        agents_en_alerte=list(set(agents_en_alerte)),
        confiance_moyenne=round(confiance_moyenne, 2),
    )


async def forecast_transaction_volume(
    agency_id: str,
    db=None,
) -> TransactionVolumeForecast:
    """
    Prévoit le volume de transactions et les montants par heure pour une agence.
    """
    previsions_volume: dict[str, int] = {}
    previsions_montant: dict[str, float] = {}

    if db is not None:
        try:
            from sqlalchemy import text
            result = db.execute(text("""
                SELECT
                    EXTRACT(HOUR FROM date_transaction) AS heure,
                    AVG(cnt) AS volume_moyen,
                    AVG(montant_total) AS montant_moyen
                FROM (
                    SELECT
                        DATE_TRUNC('hour', date_transaction) AS dt_heure,
                        EXTRACT(HOUR FROM date_transaction) AS heure,
                        COUNT(*) AS cnt,
                        SUM(montant) AS montant_total
                    FROM transactions
                    WHERE agency_id = :agency_id
                      AND date_transaction >= NOW() - INTERVAL '28 days'
                    GROUP BY 1, 2
                ) sub
                GROUP BY heure
                ORDER BY heure
            """), {"agency_id": agency_id}).fetchall()

            now = datetime.now()
            stats_heure = {int(row.heure): (float(row.volume_moyen), float(row.montant_moyen)) for row in result}

            for i in range(24):
                heure_cible = (now.hour + i) % 24
                heure_label = (now + timedelta(hours=i)).strftime("%Y-%m-%d %H:00")
                vol, mont = stats_heure.get(heure_cible, (5, 50000))
                previsions_volume[heure_label] = max(0, int(vol))
                previsions_montant[heure_label] = max(0.0, round(mont, 2))

        except Exception as e:
            logger.warning(f"Erreur prévision volume transactions pour {agency_id} : {e}")

    if not previsions_volume:
        # Profil par défaut
        now = datetime.now()
        profil = {8: 20, 9: 30, 10: 25, 11: 20, 12: 15, 13: 15,
                  14: 18, 15: 22, 16: 25, 17: 30, 18: 35, 19: 28}
        for i in range(24):
            heure_cible = (now.hour + i) % 24
            heure_label = (now + timedelta(hours=i)).strftime("%Y-%m-%d %H:00")
            vol = profil.get(heure_cible, 5)
            previsions_volume[heure_label] = vol
            previsions_montant[heure_label] = vol * 10000.0

    return TransactionVolumeForecast(
        agency_id=agency_id,
        previsions_volume=previsions_volume,
        previsions_montant=previsions_montant,
        confiance=0.6 if db is not None else 0.1,
    )


async def forecast_revenue(
    network_id: str,
    db=None,
) -> RevenueForecast:
    """
    Prévoit les revenus en commissions pour les 7 prochains jours.
    """
    previsions: dict[str, float] = {}
    comparaison_pct: float | None = None

    if db is not None:
        try:
            from sqlalchemy import text
            result = db.execute(text("""
                SELECT
                    EXTRACT(DOW FROM date_transaction) AS jour_semaine,
                    AVG(commission_totale) AS commission_moyenne
                FROM (
                    SELECT
                        DATE(date_transaction) AS jour,
                        EXTRACT(DOW FROM date_transaction) AS jour_semaine,
                        SUM(commission) AS commission_totale
                    FROM transactions
                    WHERE network_id = :network_id
                      AND date_transaction >= NOW() - INTERVAL '28 days'
                    GROUP BY 1, 2
                ) sub
                GROUP BY jour_semaine
            """), {"network_id": network_id}).fetchall()

            stats_jour = {int(row.jour_semaine): float(row.commission_moyenne) for row in result}

            for d in range(1, 8):
                date_cible = datetime.now() + timedelta(days=d)
                jour_semaine = date_cible.weekday()  # 0=lundi
                dow = (jour_semaine + 1) % 7  # Conversion vers format SQL DOW (0=dimanche)
                commission = stats_jour.get(dow, 50000.0)
                previsions[date_cible.strftime("%Y-%m-%d")] = round(commission, 2)

        except Exception as e:
            logger.warning(f"Erreur prévision revenus pour {network_id} : {e}")

    if not previsions:
        for d in range(1, 8):
            date_cible = datetime.now() + timedelta(days=d)
            previsions[date_cible.strftime("%Y-%m-%d")] = 50000.0

    total = sum(previsions.values())
    confiance = 0.5 if db is not None else 0.1

    return RevenueForecast(
        network_id=network_id,
        previsions_commissions=previsions,
        total_estime_7j=round(total, 2),
        comparaison_semaine_precedente_pct=comparaison_pct,
        confiance=confiance,
    )
