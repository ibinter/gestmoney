"""
Service métier de détection de fraude.
Combine le modèle ML (Isolation Forest) et les règles métier Mobile Money
pour produire une décision finale avec score, niveau de risque et raisons.
Sauvegarde les alertes en base de données si le score dépasse le seuil configuré.
"""
import logging
import time
from datetime import datetime
from typing import Any

from app.config import settings
from app.models.fraud_detector import fraud_detector
from app.schemas.fraud import FraudScore, NiveauRisque

logger = logging.getLogger(__name__)


def _compute_final_score(ml_score: float, regles_score: int) -> int:
    """
    Fusionne le score ML (0-1) et le score règles métier (0-100)
    en un score final entre 0 et 100.

    Pondération :
    - Si le modèle est entraîné : 40% ML + 60% règles métier
    - Si pas de modèle : 100% règles métier
    """
    if fraud_detector.is_trained:
        score_ml_100 = ml_score * 100
        return min(100, int(0.4 * score_ml_100 + 0.6 * regles_score))
    else:
        return min(100, regles_score)


def _score_to_niveau(score: int) -> NiveauRisque:
    """Convertit un score numérique en niveau de risque catégoriel."""
    if score < 30:
        return NiveauRisque.LOW
    elif score < 60:
        return NiveauRisque.MEDIUM
    elif score < 80:
        return NiveauRisque.HIGH
    else:
        return NiveauRisque.CRITICAL


async def analyze_transaction(
    transaction: dict[str, Any],
    transactions_recentes: list[dict] | None = None,
    db=None,
) -> FraudScore:
    """
    Analyse complète d'une transaction pour détection de fraude.

    Étapes :
    1. Prédiction ML (si modèle entraîné)
    2. Application des règles métier
    3. Fusion des scores
    4. Sauvegarde de l'alerte si score > seuil
    5. Retour du FraudScore

    Args:
        transaction: Dictionnaire de la transaction à analyser
        transactions_recentes: Transactions récentes de l'agent (dernière heure)
        db: Session SQLAlchemy (optionnelle)

    Returns:
        FraudScore avec score, niveau_risque, raisons et flag alerte_creee
    """
    debut = time.time()
    raisons: list[str] = []
    alerte_creee = False

    # Étape 1 : Prédiction ML
    ml_result = fraud_detector.predict(transaction)
    raisons.extend(ml_result["raisons_ml"])

    # Étape 2 : Règles métier
    regles_result = fraud_detector.apply_business_rules(transaction, transactions_recentes)
    raisons.extend(regles_result["regles_declenchees"])

    # Étape 3 : Score final fusionné
    score_final = _compute_final_score(ml_result["ml_score"], regles_result["regles_score"])
    niveau_risque = _score_to_niveau(score_final)

    # Étape 4 : Sauvegarde de l'alerte si score dépasse le seuil
    if score_final >= settings.FRAUD_ALERT_THRESHOLD:
        alerte_creee = await _save_fraud_alert(
            transaction=transaction,
            score=score_final,
            niveau_risque=niveau_risque,
            raisons=raisons,
            db=db,
        )

    duree_ms = (time.time() - debut) * 1000

    return FraudScore(
        transaction_reference=transaction.get("reference"),
        agent_id=str(transaction.get("agent_id", "")),
        score=score_final,
        niveau_risque=niveau_risque,
        raisons=raisons if raisons else ["Aucune anomalie détectée"],
        alerte_creee=alerte_creee,
        duree_analyse_ms=round(duree_ms, 2),
        analyse_le=datetime.now(),
    )


async def _save_fraud_alert(
    transaction: dict[str, Any],
    score: int,
    niveau_risque: NiveauRisque,
    raisons: list[str],
    db=None,
) -> bool:
    """
    Sauvegarde une alerte fraude en base de données.
    Retourne True si la sauvegarde a réussi, False sinon.
    """
    if db is None:
        logger.warning(
            f"Alerte fraude non persistée (pas de session DB) : "
            f"agent={transaction.get('agent_id')}, score={score}"
        )
        return False

    try:
        from sqlalchemy import text

        query = text("""
            INSERT INTO fraud_alerts
                (tenant_id, agent_id, transaction_reference, score, niveau_risque, raisons, statut, cree_le)
            VALUES
                (:tenant_id, :agent_id, :reference, :score, :niveau_risque, :raisons, 'ACTIVE', NOW())
            ON CONFLICT DO NOTHING
        """)

        db.execute(query, {
            "tenant_id": transaction.get("tenant_id", ""),
            "agent_id": transaction.get("agent_id", ""),
            "reference": transaction.get("reference"),
            "score": score,
            "niveau_risque": niveau_risque.value,
            "raisons": "; ".join(raisons),
        })
        db.commit()
        logger.info(
            f"Alerte fraude créée : agent={transaction.get('agent_id')}, "
            f"score={score}, niveau={niveau_risque.value}"
        )
        return True

    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde de l'alerte fraude : {e}")
        try:
            db.rollback()
        except Exception:
            pass
        return False


async def get_fraud_stats(tenant_id: str, periode_jours: int = 30, db=None) -> dict[str, Any]:
    """
    Calcule les statistiques fraude pour un tenant sur une période.
    Retourne des valeurs par défaut si la base est inaccessible.
    """
    if db is None:
        return {
            "tenant_id": tenant_id,
            "periode_jours": periode_jours,
            "nb_alertes_total": 0,
            "nb_alertes_actives": 0,
            "nb_alertes_resolues": 0,
            "nb_faux_positifs": 0,
            "montant_total_a_risque": 0.0,
            "taux_detection_pct": 0.0,
            "repartition_par_niveau": {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0},
            "top_agents_suspects": [],
        }

    try:
        from sqlalchemy import text

        result = db.execute(text("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN statut = 'ACTIVE' THEN 1 ELSE 0 END) as actives,
                SUM(CASE WHEN statut = 'RESOLUE' THEN 1 ELSE 0 END) as resolues,
                SUM(CASE WHEN statut = 'FAUX_POSITIF' THEN 1 ELSE 0 END) as faux_positifs,
                SUM(CASE WHEN niveau_risque = 'LOW' THEN 1 ELSE 0 END) as low,
                SUM(CASE WHEN niveau_risque = 'MEDIUM' THEN 1 ELSE 0 END) as medium,
                SUM(CASE WHEN niveau_risque = 'HIGH' THEN 1 ELSE 0 END) as high,
                SUM(CASE WHEN niveau_risque = 'CRITICAL' THEN 1 ELSE 0 END) as critical
            FROM fraud_alerts
            WHERE tenant_id = :tenant_id
              AND cree_le >= NOW() - INTERVAL ':days days'
        """), {"tenant_id": tenant_id, "days": periode_jours}).fetchone()

        if result:
            return {
                "tenant_id": tenant_id,
                "periode_jours": periode_jours,
                "nb_alertes_total": int(result.total or 0),
                "nb_alertes_actives": int(result.actives or 0),
                "nb_alertes_resolues": int(result.resolues or 0),
                "nb_faux_positifs": int(result.faux_positifs or 0),
                "montant_total_a_risque": 0.0,
                "taux_detection_pct": 0.0,
                "repartition_par_niveau": {
                    "LOW": int(result.low or 0),
                    "MEDIUM": int(result.medium or 0),
                    "HIGH": int(result.high or 0),
                    "CRITICAL": int(result.critical or 0),
                },
                "top_agents_suspects": [],
            }
    except Exception as e:
        logger.error(f"Erreur lors du calcul des statistiques fraude : {e}")

    return await get_fraud_stats(tenant_id, periode_jours, db=None)
