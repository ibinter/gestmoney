"""
Routeur FastAPI pour la détection d'anomalies opérationnelles.
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.anomaly import AnomalyAcknowledgeRequest, AnomalyRecord
from app.services.anomaly_service import (
    acknowledge_anomaly,
    detect_active_anomalies,
    get_anomaly_history,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/anomaly", tags=["Anomalies"])


@router.get(
    "/detect",
    response_model=list[AnomalyRecord],
    summary="Détecter les anomalies actives",
    description="Lance une détection en temps réel des anomalies réseau, agent et financières.",
)
async def detect_anomalies(
    tenant_id: str = Query(..., description="Identifiant du tenant"),
    type: Optional[str] = Query(
        None,
        description="Filtrer par type : ANOMALIE_RESEAU, AGENT_INACTIF, ANOMALIE_FINANCIERE",
    ),
    db: Session = Depends(get_db),
) -> list[AnomalyRecord]:
    """Détecte et retourne les anomalies actives pour le tenant donné."""
    try:
        return await detect_active_anomalies(
            tenant_id=tenant_id,
            type_filtre=type,
            db=db,
        )
    except Exception as e:
        logger.error(f"Erreur lors de la détection d'anomalies : {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/history",
    response_model=list[AnomalyRecord],
    summary="Historique des anomalies",
)
async def anomaly_history(
    tenant_id: str = Query(...),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[AnomalyRecord]:
    """Retourne l'historique des anomalies détectées pour un tenant."""
    try:
        return await get_anomaly_history(tenant_id, limit, db)
    except Exception as e:
        logger.error(f"Erreur récupération historique anomalies : {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/{anomaly_id}/acknowledge",
    summary="Acquitter une anomalie",
    description="Marque une anomalie comme prise en compte par un opérateur.",
)
async def acknowledge(
    anomaly_id: str,
    payload: AnomalyAcknowledgeRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Acquitte une anomalie active."""
    success = await acknowledge_anomaly(
        anomaly_id=anomaly_id,
        acquitte_par=payload.acquitte_par,
        commentaire=payload.commentaire,
        db=db,
    )
    if success:
        return {"success": True, "message": f"Anomalie {anomaly_id} acquittée."}
    else:
        raise HTTPException(
            status_code=404,
            detail="Anomalie introuvable ou déjà acquittée.",
        )
