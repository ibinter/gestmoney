"""
Détection d'anomalies dans les patterns de transactions Mobile Money.
Trois types d'anomalies surveillées :
  - Réseau  : chute soudaine du volume de transactions
  - Agent   : agent sans activité pendant ses heures habituelles
  - Finance : écart de caisse inexpliqué
"""
import logging
from datetime import datetime
from typing import Any

import numpy as np
import pandas as pd

from app.config import settings

logger = logging.getLogger(__name__)

# Seuil de chute de volume pour déclarer une anomalie réseau
NETWORK_DROP_THRESHOLD_PCT = 50.0


class AnomalyDetector:
    """
    Détecte les anomalies opérationnelles et financières dans le réseau Mobile Money.
    """

    def detect_network_anomaly(
        self,
        current_volume: int,
        historical_volumes: list[int],
        tenant_id: str,
        fenetre_label: str = "dernière heure",
    ) -> dict[str, Any] | None:
        """
        Détecte une chute soudaine du volume de transactions réseau.

        Args:
            current_volume: Nombre de transactions dans la fenêtre courante
            historical_volumes: Volumes des mêmes fenêtres les jours/semaines précédents
            tenant_id: Identifiant du tenant
            fenetre_label: Description de la fenêtre temporelle

        Returns:
            dict décrivant l'anomalie ou None si tout est normal
        """
        if not historical_volumes:
            logger.debug("Pas d'historique de volume réseau — anomalie réseau non détectable.")
            return None

        moyenne_historique = float(np.mean(historical_volumes))

        if moyenne_historique == 0:
            return None

        chute_pct = (1.0 - current_volume / moyenne_historique) * 100.0

        if chute_pct >= NETWORK_DROP_THRESHOLD_PCT:
            return {
                "type": "ANOMALIE_RESEAU",
                "severite": "HIGH" if chute_pct >= 75 else "MEDIUM",
                "tenant_id": tenant_id,
                "description": (
                    f"Chute du volume transactions de {chute_pct:.1f}% sur la {fenetre_label} "
                    f"(actuel : {current_volume}, moyenne historique : {moyenne_historique:.0f})"
                ),
                "valeur_actuelle": current_volume,
                "valeur_attendue": round(moyenne_historique),
                "ecart_pct": round(chute_pct, 1),
                "detecte_a": datetime.now().isoformat(),
            }

        return None

    def detect_agent_inactivity(
        self,
        agent_id: str,
        heure_actuelle: int,
        transactions_aujourd_hui: list[dict],
        heures_habituelles: list[int] | None = None,
    ) -> dict[str, Any] | None:
        """
        Détecte un agent sans transaction pendant ses heures habituelles.

        Args:
            agent_id: Identifiant de l'agent
            heure_actuelle: Heure courante (0-23)
            transactions_aujourd_hui: Transactions de l'agent aujourd'hui
            heures_habituelles: Créneaux horaires habituels de l'agent (déduits de l'historique)

        Returns:
            dict décrivant l'anomalie ou None
        """
        # Heures d'ouverture standard si pas d'historique
        if heures_habituelles is None:
            heures_habituelles = list(range(7, 21))  # 7h-20h

        # Pas une heure habituelle → pas d'anomalie
        if heure_actuelle not in heures_habituelles:
            return None

        # L'agent a des transactions aujourd'hui → pas d'anomalie
        if transactions_aujourd_hui:
            return None

        return {
            "type": "AGENT_INACTIF",
            "severite": "MEDIUM",
            "agent_id": agent_id,
            "description": (
                f"L'agent {agent_id} n'a enregistré aucune transaction aujourd'hui "
                f"alors qu'il est {heure_actuelle}h (heure habituelle d'activité)"
            ),
            "heure_detection": heure_actuelle,
            "detecte_a": datetime.now().isoformat(),
        }

    def detect_cash_discrepancy(
        self,
        agent_id: str,
        solde_theorique: float,
        solde_physique: float,
        tolerance: float | None = None,
    ) -> dict[str, Any] | None:
        """
        Détecte un écart de caisse inexpliqué supérieur à la tolérance configurée.

        Args:
            agent_id: Identifiant de l'agent
            solde_theorique: Solde calculé d'après les transactions enregistrées (XOF)
            solde_physique: Solde compté physiquement lors de l'arrêté de caisse (XOF)
            tolerance: Écart maximum toléré (défaut : MAX_CASH_DISCREPANCY de la config)

        Returns:
            dict décrivant l'anomalie ou None
        """
        if tolerance is None:
            tolerance = settings.MAX_CASH_DISCREPANCY

        ecart = abs(solde_theorique - solde_physique)

        if ecart <= tolerance:
            return None

        direction = "excédent" if solde_physique > solde_theorique else "manquant"
        severite = "CRITICAL" if ecart > 5 * tolerance else "HIGH"

        return {
            "type": "ANOMALIE_FINANCIERE",
            "severite": severite,
            "agent_id": agent_id,
            "description": (
                f"Écart de caisse {direction} de {ecart:,.0f} XOF détecté pour l'agent {agent_id} "
                f"(théorique : {solde_theorique:,.0f} XOF, physique : {solde_physique:,.0f} XOF)"
            ),
            "ecart_xof": round(ecart, 2),
            "direction": direction,
            "solde_theorique": round(solde_theorique, 2),
            "solde_physique": round(solde_physique, 2),
            "detecte_a": datetime.now().isoformat(),
        }

    def run_all_checks(
        self,
        tenant_id: str,
        network_data: dict[str, Any] | None = None,
        agents_data: list[dict[str, Any]] | None = None,
        cash_data: list[dict[str, Any]] | None = None,
    ) -> list[dict[str, Any]]:
        """
        Lance toutes les vérifications d'anomalies et retourne la liste des anomalies détectées.
        """
        anomalies: list[dict[str, Any]] = []

        # Anomalie réseau
        if network_data:
            anomalie_reseau = self.detect_network_anomaly(
                current_volume=network_data.get("volume_actuel", 0),
                historical_volumes=network_data.get("volumes_historiques", []),
                tenant_id=tenant_id,
            )
            if anomalie_reseau:
                anomalies.append(anomalie_reseau)

        # Inactivité agent
        heure_actuelle = datetime.now().hour
        for agent in (agents_data or []):
            anomalie_agent = self.detect_agent_inactivity(
                agent_id=agent.get("agent_id", ""),
                heure_actuelle=heure_actuelle,
                transactions_aujourd_hui=agent.get("transactions_today", []),
                heures_habituelles=agent.get("heures_habituelles"),
            )
            if anomalie_agent:
                anomalies.append(anomalie_agent)

        # Écarts de caisse
        for cash in (cash_data or []):
            anomalie_caisse = self.detect_cash_discrepancy(
                agent_id=cash.get("agent_id", ""),
                solde_theorique=float(cash.get("solde_theorique", 0)),
                solde_physique=float(cash.get("solde_physique", 0)),
            )
            if anomalie_caisse:
                anomalies.append(anomalie_caisse)

        logger.info(f"{len(anomalies)} anomalie(s) détectée(s) pour le tenant {tenant_id}.")
        return anomalies


# Instance singleton
anomaly_detector = AnomalyDetector()
