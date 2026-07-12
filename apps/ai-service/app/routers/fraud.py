"""
Routeur FastAPI pour la détection de fraude.
Expose les endpoints d'analyse de transactions, de gestion des alertes
et de statistiques.
"""
import logging
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.fraud import (
    BatchFraudResult,
    BatchTransactionInput,
    FraudAlert,
    FraudAlertResolveRequest,
    FraudScore,
    FraudStats,
    TransactionInput,
)
from app.services.fraud_service import analyze_transaction, get_fraud_stats
from app.models.fraud_detector import fraud_detector

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/fraud", tags=["Détection de Fraude"])


@router.post(
    "/analyze",
    response_model=FraudScore,
    summary="Analyser une transaction",
    description="Analyse une transaction et retourne un score de risque fraude (0-100) avec les raisons.",
)
async def analyze_one(
    transaction: TransactionInput,
    db: Session = Depends(get_db),
) -> FraudScore:
    """
    Analyse une transaction unique pour détecter la fraude.
    Combine le modèle ML et les règles métier Mobile Money.
    """
    try:
        tx_dict = transaction.model_dump()
        transactions_recentes = tx_dict.pop("transactions_recentes", None)

        result = await analyze_transaction(
            transaction=tx_dict,
            transactions_recentes=transactions_recentes,
            db=db,
        )
        return result
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse de transaction : {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne lors de l'analyse : {str(e)}",
        )


@router.post(
    "/batch-analyze",
    response_model=BatchFraudResult,
    summary="Analyser un lot de transactions",
    description="Analyse jusqu'à 500 transactions en une seule requête.",
)
async def analyze_batch(
    payload: BatchTransactionInput,
    db: Session = Depends(get_db),
) -> BatchFraudResult:
    """Analyse un lot de transactions en parallèle séquentielle."""
    debut = time.time()
    resultats: list[FraudScore] = []
    nb_alertes = 0

    for transaction in payload.transactions:
        try:
            tx_dict = transaction.model_dump()
            transactions_recentes = tx_dict.pop("transactions_recentes", None)
            score = await analyze_transaction(tx_dict, transactions_recentes, db)
            resultats.append(score)
            if score.alerte_creee:
                nb_alertes += 1
        except Exception as e:
            logger.warning(f"Transaction ignorée dans le batch : {e}")

    duree_ms = (time.time() - debut) * 1000

    return BatchFraudResult(
        nb_analysees=len(resultats),
        nb_alertes=nb_alertes,
        resultats=resultats,
        duree_totale_ms=round(duree_ms, 2),
    )


@router.get(
    "/alerts",
    response_model=list[FraudAlert],
    summary="Liste des alertes fraude actives",
)
async def get_alerts(
    tenant_id: str = Query(..., description="Identifiant du tenant"),
    severity: Optional[str] = Query(None, description="Filtrer par niveau : LOW, MEDIUM, HIGH, CRITICAL"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[FraudAlert]:
    """Retourne la liste des alertes fraude actives pour un tenant."""
    try:
        from sqlalchemy import text

        query_parts = ["WHERE tenant_id = :tenant_id AND statut = 'ACTIVE'"]
        params: dict = {"tenant_id": tenant_id, "limit": limit}

        if severity:
            query_parts.append("AND niveau_risque = :severity")
            params["severity"] = severity.upper()

        sql = text(f"""
            SELECT id, tenant_id, agent_id, transaction_reference, score,
                   niveau_risque, raisons, statut, cree_le, resolu_le, resolu_par
            FROM fraud_alerts
            {' '.join(query_parts)}
            ORDER BY score DESC, cree_le DESC
            LIMIT :limit
        """)

        rows = db.execute(sql, params).fetchall()

        return [
            FraudAlert(
                id=str(row.id),
                tenant_id=str(row.tenant_id),
                agent_id=str(row.agent_id),
                transaction_reference=str(row.transaction_reference) if row.transaction_reference else None,
                score=int(row.score),
                niveau_risque=row.niveau_risque,
                raisons=str(row.raisons).split("; ") if row.raisons else [],
                statut=row.statut,
                cree_le=row.cree_le,
                resolu_le=row.resolu_le,
                resolu_par=str(row.resolu_par) if row.resolu_par else None,
            )
            for row in rows
        ]
    except Exception as e:
        logger.error(f"Erreur récupération alertes : {e}")
        return []


@router.post(
    "/alerts/{alert_id}/resolve",
    summary="Résoudre une alerte fraude",
)
async def resolve_alert(
    alert_id: str,
    payload: FraudAlertResolveRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Marque une alerte fraude comme résolue ou faux positif."""
    try:
        from sqlalchemy import text
        result = db.execute(text("""
            UPDATE fraud_alerts
            SET statut = :statut,
                resolu_le = NOW(),
                resolu_par = :resolu_par,
                commentaire_resolution = :commentaire
            WHERE id = :id
            RETURNING id
        """), {
            "id": alert_id,
            "statut": payload.statut.value,
            "resolu_par": payload.resolu_par,
            "commentaire": payload.commentaire,
        })
        db.commit()

        if result.fetchone():
            return {"success": True, "message": f"Alerte {alert_id} mise à jour avec succès."}
        else:
            raise HTTPException(status_code=404, detail="Alerte introuvable.")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur résolution alerte {alert_id} : {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/stats",
    response_model=FraudStats,
    summary="Statistiques de détection de fraude",
)
async def fraud_statistics(
    tenant_id: str = Query(...),
    periode_jours: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
) -> FraudStats:
    """Retourne les statistiques fraude pour un tenant sur une période donnée."""
    stats = await get_fraud_stats(tenant_id, periode_jours, db)
    return FraudStats(**stats)


@router.post(
    "/train",
    summary="Déclencher le ré-entraînement du modèle",
    description="Réentraîne le modèle Isolation Forest sur les données récentes. Admin uniquement.",
)
async def train_model(
    tenant_id: str = Query(...),
    db: Session = Depends(get_db),
) -> dict:
    """
    Charge les transactions récentes depuis la base et réentraîne le modèle ML.
    Requiert des droits administrateur (à protéger par un middleware d'auth en production).
    """
    try:
        from sqlalchemy import text
        import pandas as pd

        rows = db.execute(text("""
            SELECT
                agent_id, montant,
                EXTRACT(HOUR FROM date_transaction) AS heure,
                operateur, type_transaction,
                date_transaction,
                COUNT(*) OVER (
                    PARTITION BY agent_id
                    ORDER BY date_transaction
                    RANGE BETWEEN INTERVAL '1 hour' PRECEDING AND CURRENT ROW
                ) AS frequence_agent
            FROM transactions
            WHERE tenant_id = :tenant_id
              AND date_transaction >= NOW() - INTERVAL '90 days'
            LIMIT 50000
        """), {"tenant_id": tenant_id}).fetchall()

        if not rows:
            return {"success": False, "message": "Pas de données disponibles pour l'entraînement."}

        df = pd.DataFrame([dict(row._mapping) for row in rows])
        fraud_detector.train(df)
        fraud_detector.save_model("/app/models_saved")

        return {
            "success": True,
            "nb_transactions": len(df),
            "modele_entraine": fraud_detector.is_trained,
            "message": f"Modèle réentraîné sur {len(df)} transactions.",
        }
    except Exception as e:
        logger.error(f"Erreur entraînement modèle : {e}")
        raise HTTPException(status_code=500, detail=str(e))
