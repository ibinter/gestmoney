"""
Prévision des besoins en float par agent/opérateur.
Algorithme : moyenne mobile des 4 dernières semaines + tendance linéaire.
Gère le cold start si l'historique est insuffisant.
"""
import logging
from datetime import datetime, timedelta
from typing import Any

import numpy as np
import pandas as pd

from app.config import settings

logger = logging.getLogger(__name__)


class FloatForecaster:
    """
    Prévoit les besoins en float (liquidité Mobile Money) pour les prochaines 24h
    et les 7 prochains jours, par agent et par opérateur.
    """

    def __init__(self) -> None:
        # Taux de croissance hebdomadaire supposé (1% par défaut)
        self._tendance_hebdo: float = 0.01

    def _compute_trend(self, series: pd.Series) -> float:
        """
        Calcule la tendance linéaire (pente) d'une série temporelle.
        Retourne le coefficient de variation par unité de temps.
        """
        if len(series) < 2:
            return 0.0
        x = np.arange(len(series), dtype=float)
        y = series.values.astype(float)
        # Régression linéaire simple : pente = cov(x,y) / var(x)
        pente = float(np.polyfit(x, y, 1)[0])
        return pente

    def forecast_next_24h(
        self,
        agent_id: str,
        operator: str,
        historical_data: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """
        Prévoit le float nécessaire heure par heure pour les prochaines 24h.

        Args:
            agent_id: Identifiant de l'agent
            operator: Code opérateur (ex: 'MTN', 'ORANGE')
            historical_data: Liste de dicts avec {date_heure, montant_cumul_float,
                             volume_transactions, heure}

        Returns:
            dict avec :
                - previsions: {heure_str: float_prévu} pour chaque heure des 24 prochaines
                - alertes: list[str] — alertes si float prévu < seuil
                - confiance: float entre 0 et 1
        """
        alertes: list[str] = []
        previsions: dict[str, float] = {}

        if not historical_data:
            logger.info(f"Cold start pour agent {agent_id}/{operator} — utilisation des valeurs par défaut.")
            return self._default_forecast_24h(alertes)

        df = pd.DataFrame(historical_data)

        # Vérification des colonnes minimales
        if "heure" not in df.columns or "montant_cumul_float" not in df.columns:
            logger.warning("Colonnes manquantes dans historical_data pour float_forecaster.")
            return self._default_forecast_24h(alertes)

        df["montant_cumul_float"] = pd.to_numeric(df["montant_cumul_float"], errors="coerce").fillna(0)
        df["heure"] = pd.to_numeric(df["heure"], errors="coerce").fillna(0).astype(int)

        # Calcul de la moyenne par heure sur les 4 dernières semaines
        moyenne_par_heure = df.groupby("heure")["montant_cumul_float"].mean()

        # Tendance globale sur les données disponibles
        tendance = self._compute_trend(df["montant_cumul_float"])

        maintenant = datetime.now()
        confiance = min(1.0, len(df) / 672)  # 672 = 4 semaines * 7 jours * 24h

        for i in range(24):
            heure_cible = (maintenant.hour + i) % 24
            heure_label = (maintenant + timedelta(hours=i)).strftime("%Y-%m-%d %H:00")

            # Valeur de base = moyenne historique à cette heure
            valeur_base = float(moyenne_par_heure.get(heure_cible, df["montant_cumul_float"].mean()))

            # Ajustement par la tendance (projection sur i heures)
            ajustement_tendance = tendance * i
            float_prevu = max(0.0, valeur_base + ajustement_tendance)

            previsions[heure_label] = round(float_prevu, 2)

            # Alerte si le float prévu passe sous le seuil minimum
            if float_prevu < settings.FLOAT_LOW_THRESHOLD:
                alertes.append(
                    f"Float prévu insuffisant à {heure_label} : "
                    f"{float_prevu:,.0f} XOF (seuil : {settings.FLOAT_LOW_THRESHOLD:,.0f} XOF)"
                )

        return {
            "agent_id": agent_id,
            "operator": operator,
            "previsions": previsions,
            "alertes": alertes,
            "confiance": round(confiance, 2),
            "nb_points_historique": len(df),
        }

    def forecast_replenishment_need(
        self,
        agent_id: str,
        operator: str,
        historical_data: list[dict[str, Any]],
        days: int = 7,
    ) -> dict[str, Any]:
        """
        Estime le besoin de rechargement float pour les N prochains jours.

        Returns:
            dict avec :
                - besoins_journaliers: {date: montant_prévu}
                - total_estime: montant total à provisionner sur la période
                - recommandation: texte explicatif
        """
        if not historical_data:
            montant_defaut = settings.FLOAT_LOW_THRESHOLD * 2
            besoins = {
                (datetime.now() + timedelta(days=d)).strftime("%Y-%m-%d"): montant_defaut
                for d in range(1, days + 1)
            }
            return {
                "agent_id": agent_id,
                "operator": operator,
                "besoins_journaliers": besoins,
                "total_estime": montant_defaut * days,
                "recommandation": "Données historiques insuffisantes. Estimation basée sur le seuil minimum.",
                "confiance": 0.1,
            }

        df = pd.DataFrame(historical_data)

        if "date" not in df.columns or "montant_cumul_float" not in df.columns:
            logger.warning("Colonnes 'date' ou 'montant_cumul_float' manquantes.")
            return self.forecast_replenishment_need(agent_id, operator, [], days)

        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        df["montant_cumul_float"] = pd.to_numeric(df["montant_cumul_float"], errors="coerce").fillna(0)
        df = df.dropna(subset=["date"])

        # Agrégation journalière : consommation quotidienne de float
        df["jour_semaine"] = df["date"].dt.dayofweek
        conso_par_jour_semaine = df.groupby("jour_semaine")["montant_cumul_float"].mean()

        tendance_journaliere = self._compute_trend(
            df.groupby(df["date"].dt.date)["montant_cumul_float"].sum()
        )

        besoins_journaliers: dict[str, float] = {}
        for d in range(1, days + 1):
            date_cible = datetime.now() + timedelta(days=d)
            jour_semaine = date_cible.weekday()

            conso_base = float(conso_par_jour_semaine.get(jour_semaine, df["montant_cumul_float"].mean()))
            ajustement = tendance_journaliere * d
            besoin = max(0.0, conso_base + ajustement)

            besoins_journaliers[date_cible.strftime("%Y-%m-%d")] = round(besoin, 2)

        total = sum(besoins_journaliers.values())
        confiance = min(1.0, len(df) / (days * 4 * 7))

        recommandation = (
            f"Prévoir un approvisionnement de {total:,.0f} XOF pour {operator} "
            f"sur les {days} prochains jours (confiance : {confiance:.0%})."
        )

        return {
            "agent_id": agent_id,
            "operator": operator,
            "besoins_journaliers": besoins_journaliers,
            "total_estime": round(total, 2),
            "recommandation": recommandation,
            "confiance": round(confiance, 2),
        }

    def _default_forecast_24h(self, alertes: list[str]) -> dict[str, Any]:
        """Retourne des prévisions par défaut en cas de cold start."""
        maintenant = datetime.now()
        # Profil type de consommation de float par heure (relatif)
        profil_heure = {
            0: 0.2, 1: 0.1, 2: 0.05, 3: 0.05, 4: 0.05, 5: 0.1,
            6: 0.5, 7: 0.8, 8: 1.0, 9: 1.0, 10: 0.9, 11: 0.8,
            12: 0.7, 13: 0.7, 14: 0.8, 15: 0.9, 16: 1.0, 17: 1.0,
            18: 0.9, 19: 0.8, 20: 0.7, 21: 0.5, 22: 0.4, 23: 0.3,
        }
        valeur_base = settings.FLOAT_LOW_THRESHOLD * 1.5

        previsions: dict[str, float] = {}
        for i in range(24):
            heure_cible = (maintenant.hour + i) % 24
            heure_label = (maintenant + timedelta(hours=i)).strftime("%Y-%m-%d %H:00")
            float_prevu = valeur_base * profil_heure.get(heure_cible, 0.5)
            previsions[heure_label] = round(float_prevu, 2)

        alertes.append("Mode cold start : prévisions basées sur un profil de consommation type.")

        return {
            "agent_id": "unknown",
            "operator": "unknown",
            "previsions": previsions,
            "alertes": alertes,
            "confiance": 0.0,
            "nb_points_historique": 0,
        }


# Instance singleton
float_forecaster = FloatForecaster()
