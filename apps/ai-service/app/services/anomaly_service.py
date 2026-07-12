"""
Service de détection d'anomalies opérationnelles.
Orchestre les appels au modèle AnomalyDetector et la persistance des anomalies.
"""
import logging
from datetime import datetime
from typing import Any

from app.models.anomaly_detector import anomaly_detector
from app.schemas.anomaly import AnomalyRecord, StatutAnomalie, TypeAnomalie, SeveriteAnomalie

logger = logging.getLogger(__name__)


async def detect_active_anomalies(
    tenant_id: str,
    type_filtre: str | None = None,
    db=None,
) -> list[AnomalyRecord]:
    """
    Détecte et retourne les anomalies actives pour un tenant.
    Si la base est inaccessible, effectue une détection en mémoire avec des données synthétiques.
    """
    anomalies_detectees: list[dict[str, Any]] = []

    if db is not None:
        try:
            # Récupération des données réseau pour détection
            from sqlalchemy import text

            # Volume de l'heure courante vs historique
            net_row = db.execute(text("""
                SELECT
                    COUNT(*) FILTER (WHERE date_transaction >= NOW() - INTERVAL '1 hour') AS volume_actuel,
                    ARRAY_AGG(DISTINCT cnt ORDER BY cnt) AS volumes_historiques
                FROM (
                    SELECT
                        DATE_TRUNC('hour', date_transaction) AS h,
                        COUNT(*) AS cnt
                    FROM transactions
                    WHERE tenant_id = :tenant_id
                      AND date_transaction >= NOW() - INTERVAL '7 days'
                    GROUP BY 1
                ) sub
            """), {"tenant_id": tenant_id}).fetchone()

            if net_row:
                anomalie_reseau = anomaly_detector.detect_network_anomaly(
                    current_volume=int(net_row.volume_actuel or 0),
                    historical_volumes=[int(v) for v in (net_row.volumes_historiques or []) if v],
                    tenant_id=tenant_id,
                )
                if anomalie_reseau:
                    anomalies_detectees.append(anomalie_reseau)

            # Agents inactifs
            agents_rows = db.execute(text("""
                SELECT
                    a.id AS agent_id,
                    COUNT(t.id) FILTER (WHERE DATE(t.date_transaction) = CURRENT_DATE) AS tx_today
                FROM agents a
                LEFT JOIN transactions t ON t.agent_id = a.id
                WHERE a.tenant_id = :tenant_id AND a.actif = TRUE
                GROUP BY a.id
            """), {"tenant_id": tenant_id}).fetchall()

            heure_actuelle = datetime.now().hour
            for row in agents_rows:
                anomalie_agent = anomaly_detector.detect_agent_inactivity(
                    agent_id=str(row.agent_id),
                    heure_actuelle=heure_actuelle,
                    transactions_aujourd_hui=[] if (row.tx_today or 0) == 0 else [1],
                )
                if anomalie_agent:
                    anomalies_detectees.append(anomalie_agent)

        except Exception as e:
            logger.error(f"Erreur lors de la détection d'anomalies pour {tenant_id} : {e}")

    # Conversion en schémas Pydantic
    records: list[AnomalyRecord] = []
    for anomalie in anomalies_detectees:
        try:
            # Filtre par type si demandé
            if type_filtre and anomalie.get("type") != type_filtre:
                continue

            record = AnomalyRecord(
                type=TypeAnomalie(anomalie["type"]),
                severite=SeveriteAnomalie(anomalie.get("severite", "MEDIUM")),
                tenant_id=tenant_id,
                agent_id=anomalie.get("agent_id"),
                description=anomalie["description"],
                statut=StatutAnomalie.ACTIVE,
                donnees_supplementaires={
                    k: v for k, v in anomalie.items()
                    if k not in {"type", "severite", "agent_id", "description", "detecte_a"}
                },
                detecte_a=datetime.fromisoformat(anomalie["detecte_a"])
                if isinstance(anomalie.get("detecte_a"), str) else datetime.now(),
            )
            records.append(record)
        except Exception as e:
            logger.warning(f"Anomalie ignorée lors de la conversion Pydantic : {e}")

    return records


async def get_anomaly_history(
    tenant_id: str,
    limit: int = 50,
    db=None,
) -> list[AnomalyRecord]:
    """Récupère l'historique des anomalies depuis la base de données."""
    if db is None:
        return []

    try:
        from sqlalchemy import text
        rows = db.execute(text("""
            SELECT id, type, severite, tenant_id, agent_id, description, statut,
                   donnees_supplementaires, detecte_a, acquitte_le, acquitte_par
            FROM anomalies
            WHERE tenant_id = :tenant_id
            ORDER BY detecte_a DESC
            LIMIT :limit
        """), {"tenant_id": tenant_id, "limit": limit}).fetchall()

        return [
            AnomalyRecord(
                id=str(row.id),
                type=TypeAnomalie(row.type),
                severite=SeveriteAnomalie(row.severite),
                tenant_id=str(row.tenant_id),
                agent_id=str(row.agent_id) if row.agent_id else None,
                description=str(row.description),
                statut=StatutAnomalie(row.statut),
                detecte_a=row.detecte_a,
                acquitte_le=row.acquitte_le,
                acquitte_par=str(row.acquitte_par) if row.acquitte_par else None,
            )
            for row in rows
        ]
    except Exception as e:
        logger.error(f"Erreur récupération historique anomalies : {e}")
        return []


async def acknowledge_anomaly(
    anomaly_id: str,
    acquitte_par: str,
    commentaire: str | None = None,
    db=None,
) -> bool:
    """
    Acquitte une anomalie (marque comme prise en compte).
    Retourne True si l'opération a réussi.
    """
    if db is None:
        logger.warning(f"Impossible d'acquitter l'anomalie {anomaly_id} sans session DB.")
        return False

    try:
        from sqlalchemy import text
        result = db.execute(text("""
            UPDATE anomalies
            SET statut = 'ACQUITTEE',
                acquitte_le = NOW(),
                acquitte_par = :acquitte_par,
                commentaire = :commentaire
            WHERE id = :id
              AND statut = 'ACTIVE'
            RETURNING id
        """), {"id": anomaly_id, "acquitte_par": acquitte_par, "commentaire": commentaire})
        db.commit()

        updated = result.fetchone()
        if updated:
            logger.info(f"Anomalie {anomaly_id} acquittée par {acquitte_par}")
            return True
        else:
            logger.warning(f"Anomalie {anomaly_id} introuvable ou déjà acquittée.")
            return False

    except Exception as e:
        logger.error(f"Erreur lors de l'acquittement de l'anomalie {anomaly_id} : {e}")
        try:
            db.rollback()
        except Exception:
            pass
        return False
