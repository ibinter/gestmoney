"""
Routeur FastAPI pour les insights et recommandations IA GESTMONEY.
Fournit des analyses de performance et des recommandations personnalisées par tenant.
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.commission_optimizer import commission_optimizer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/insights", tags=["Insights IA"])


@router.get(
    "/top-agents",
    summary="Top 10 agents par performance",
    description="Retourne les 10 meilleurs agents du réseau sur la période, classés par commission.",
)
async def top_agents(
    tenant_id: str = Query(...),
    periode_jours: int = Query(30, ge=1, le=365),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> list[dict]:
    """Classement des agents par volume de commissions générées."""
    if db is None:
        return []

    try:
        from sqlalchemy import text
        rows = db.execute(text("""
            SELECT
                a.id AS agent_id,
                a.nom AS agent_nom,
                a.code AS agent_code,
                COUNT(t.id) AS nb_transactions,
                SUM(t.montant) AS volume_total,
                SUM(t.commission) AS commission_totale,
                AVG(t.montant) AS ticket_moyen,
                COUNT(DISTINCT DATE(t.date_transaction)) AS jours_actifs
            FROM agents a
            JOIN transactions t ON t.agent_id = a.id
            WHERE a.tenant_id = :tenant_id
              AND t.date_transaction >= NOW() - INTERVAL ':jours days'
            GROUP BY a.id, a.nom, a.code
            ORDER BY commission_totale DESC NULLS LAST
            LIMIT :limit
        """), {"tenant_id": tenant_id, "jours": periode_jours, "limit": limit}).fetchall()

        return [
            {
                "rang": i + 1,
                "agent_id": str(row.agent_id),
                "agent_nom": str(row.agent_nom),
                "agent_code": str(row.agent_code),
                "nb_transactions": int(row.nb_transactions or 0),
                "volume_total_xof": round(float(row.volume_total or 0), 2),
                "commission_totale_xof": round(float(row.commission_totale or 0), 2),
                "ticket_moyen_xof": round(float(row.ticket_moyen or 0), 2),
                "jours_actifs": int(row.jours_actifs or 0),
            }
            for i, row in enumerate(rows)
        ]
    except Exception as e:
        logger.error(f"Erreur top-agents : {e}")
        return []


@router.get(
    "/best-hours",
    summary="Meilleures heures de transaction par agence",
    description="Identifie les créneaux horaires les plus rentables pour une agence.",
)
async def best_hours(
    tenant_id: str = Query(...),
    agency_id: Optional[str] = Query(None),
    periode_jours: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
) -> list[dict]:
    """Retourne les heures classées par commission décroissante."""
    import pandas as pd

    if db is None:
        return commission_optimizer.get_best_hours(pd.DataFrame())

    try:
        from sqlalchemy import text
        params: dict = {"tenant_id": tenant_id, "jours": periode_jours}
        filtres = "WHERE t.tenant_id = :tenant_id AND t.date_transaction >= NOW() - INTERVAL ':jours days'"
        if agency_id:
            filtres += " AND a.id = :agency_id"
            params["agency_id"] = agency_id

        rows = db.execute(text(f"""
            SELECT
                EXTRACT(HOUR FROM t.date_transaction) AS heure,
                SUM(t.commission) AS commission,
                COUNT(t.id) AS nb_transactions,
                SUM(t.montant) AS volume
            FROM transactions t
            JOIN agencies a ON a.id = t.agency_id
            {filtres}
            GROUP BY heure
        """), params).fetchall()

        df = pd.DataFrame([dict(row._mapping) for row in rows])
        return commission_optimizer.get_best_hours(df, agency_id)
    except Exception as e:
        logger.error(f"Erreur best-hours : {e}")
        return commission_optimizer.get_best_hours(pd.DataFrame())


@router.get(
    "/operator-comparison",
    summary="Comparaison performance par opérateur",
    description="Compare le volume, les commissions et la croissance par opérateur Mobile Money.",
)
async def operator_comparison(
    tenant_id: str = Query(...),
    network_id: Optional[str] = Query(None),
    periode_jours: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
) -> list[dict]:
    """Tableau comparatif des opérateurs pour un tenant ou un réseau."""
    import pandas as pd

    if db is None:
        return []

    try:
        from sqlalchemy import text
        params: dict = {"tenant_id": tenant_id, "jours": periode_jours}
        filtres = "WHERE t.tenant_id = :tenant_id AND t.date_transaction >= NOW() - INTERVAL ':jours days'"
        if network_id:
            filtres += " AND a.network_id = :network_id"
            params["network_id"] = network_id

        rows = db.execute(text(f"""
            SELECT
                t.operateur,
                COUNT(t.id) AS nb_transactions,
                SUM(t.montant) AS volume_total,
                SUM(t.commission) AS commission_totale,
                AVG(t.montant) AS ticket_moyen
            FROM transactions t
            JOIN agents a ON a.id = t.agent_id
            {filtres}
            GROUP BY t.operateur
        """), params).fetchall()

        df = pd.DataFrame([dict(row._mapping) for row in rows])

        if df.empty:
            return []

        # Renommage des colonnes pour le commission_optimizer
        df = df.rename(columns={"nb_transactions": "count"})
        return commission_optimizer.compare_operators(df, network_id)
    except Exception as e:
        logger.error(f"Erreur operator-comparison : {e}")
        return []


@router.get(
    "/recommendations",
    summary="Recommandations IA personnalisées",
    description="Génère des recommandations actionnables basées sur les données du tenant.",
)
async def recommendations(
    tenant_id: str = Query(...),
    db: Session = Depends(get_db),
) -> list[dict]:
    """
    Analyse les patterns du tenant et génère des recommandations IA :
    - Agents sous-performants à accompagner
    - Opérateurs à privilégier
    - Créneaux horaires à optimiser
    - Alertes de rechargement proactif
    """
    recs: list[dict] = []

    if db is None:
        return [
            {
                "type": "INFO",
                "priorite": "LOW",
                "titre": "Données insuffisantes",
                "message": "Connectez votre base de données pour obtenir des recommandations personnalisées.",
                "action": None,
            }
        ]

    try:
        from sqlalchemy import text

        # Recommandation 1 : Agents inactifs depuis 3 jours
        agents_inactifs = db.execute(text("""
            SELECT a.id, a.nom
            FROM agents a
            WHERE a.tenant_id = :tenant_id AND a.actif = TRUE
              AND NOT EXISTS (
                  SELECT 1 FROM transactions t
                  WHERE t.agent_id = a.id
                    AND t.date_transaction >= NOW() - INTERVAL '3 days'
              )
            LIMIT 5
        """), {"tenant_id": tenant_id}).fetchall()

        for agent in agents_inactifs:
            recs.append({
                "type": "ACTION_REQUISE",
                "priorite": "HIGH",
                "titre": f"Agent {agent.nom} inactif depuis 3+ jours",
                "message": (
                    f"L'agent {agent.nom} (ID: {agent.id}) n'a enregistré aucune transaction "
                    "depuis 3 jours. Un accompagnement commercial est recommandé."
                ),
                "action": f"/agents/{agent.id}/contact",
            })

        # Recommandation 2 : Float bas détecté
        agents_float_bas = db.execute(text("""
            SELECT
                a.id,
                a.nom,
                t.operateur,
                (SUM(CASE WHEN t.type_transaction = 'DEPOT' THEN t.montant ELSE -t.montant END)) AS solde_float
            FROM agents a
            JOIN transactions t ON t.agent_id = a.id
            WHERE a.tenant_id = :tenant_id
              AND t.date_transaction >= NOW() - INTERVAL '24 hours'
            GROUP BY a.id, a.nom, t.operateur
            HAVING SUM(CASE WHEN t.type_transaction = 'DEPOT' THEN t.montant ELSE -t.montant END) < 50000
            LIMIT 5
        """), {"tenant_id": tenant_id}).fetchall()

        for agent in agents_float_bas:
            recs.append({
                "type": "ALERTE_FLOAT",
                "priorite": "HIGH",
                "titre": f"Float {agent.operateur} bas pour {agent.nom}",
                "message": (
                    f"Le solde float {agent.operateur} de l'agent {agent.nom} est estimé à "
                    f"{agent.solde_float:,.0f} XOF. Un rechargement est recommandé."
                ),
                "action": f"/agents/{agent.id}/recharge",
            })

        # Recommandation 3 : Tendance positive (encouragement)
        if not recs:
            recs.append({
                "type": "PERFORMANCE",
                "priorite": "LOW",
                "titre": "Réseau en bonne santé",
                "message": "Aucune alerte critique détectée. Continuez sur cette lancée !",
                "action": None,
            })

    except Exception as e:
        logger.error(f"Erreur recommandations : {e}")
        recs.append({
            "type": "ERREUR",
            "priorite": "LOW",
            "titre": "Recommandations temporairement indisponibles",
            "message": str(e),
            "action": None,
        })

    return recs
