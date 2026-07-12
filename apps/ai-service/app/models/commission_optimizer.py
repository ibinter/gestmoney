"""
Optimiseur de commissions Mobile Money.
Analyse les patterns de transactions pour recommander les plages horaires
et opérateurs les plus rentables par agent/réseau.
"""
import logging
from typing import Any

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class CommissionOptimizer:
    """
    Analyse les données historiques de commissions pour :
    - Identifier les créneaux horaires les plus rentables
    - Comparer les performances par opérateur
    - Recommander des stratégies d'optimisation
    """

    def get_best_hours(
        self,
        transactions_df: pd.DataFrame,
        agency_id: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Retourne les meilleures heures de transaction par volume et commission.

        Args:
            transactions_df: DataFrame avec colonnes [heure, commission, montant, volume]
            agency_id: Filtre optionnel sur une agence

        Returns:
            Liste des 24 heures triées par commission décroissante
        """
        if transactions_df.empty:
            return self._default_best_hours()

        if agency_id and "agency_id" in transactions_df.columns:
            transactions_df = transactions_df[transactions_df["agency_id"] == agency_id]

        required = {"heure", "commission"}
        if not required.issubset(transactions_df.columns):
            return self._default_best_hours()

        transactions_df["heure"] = pd.to_numeric(transactions_df["heure"], errors="coerce").fillna(0).astype(int)
        transactions_df["commission"] = pd.to_numeric(transactions_df["commission"], errors="coerce").fillna(0)

        stats_heure = transactions_df.groupby("heure").agg(
            commission_totale=("commission", "sum"),
            commission_moyenne=("commission", "mean"),
            nb_transactions=("commission", "count"),
        ).reset_index()

        stats_heure = stats_heure.sort_values("commission_totale", ascending=False)

        return [
            {
                "heure": int(row["heure"]),
                "commission_totale": round(float(row["commission_totale"]), 2),
                "commission_moyenne": round(float(row["commission_moyenne"]), 2),
                "nb_transactions": int(row["nb_transactions"]),
                "label": f"{int(row['heure']):02d}h00",
            }
            for _, row in stats_heure.iterrows()
        ]

    def compare_operators(
        self,
        transactions_df: pd.DataFrame,
        network_id: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Compare les performances (volume, commission, croissance) par opérateur.
        """
        if transactions_df.empty:
            return []

        if network_id and "network_id" in transactions_df.columns:
            transactions_df = transactions_df[transactions_df["network_id"] == network_id]

        if "operateur" not in transactions_df.columns:
            return []

        transactions_df["commission"] = pd.to_numeric(
            transactions_df.get("commission", pd.Series([0] * len(transactions_df))),
            errors="coerce"
        ).fillna(0)
        transactions_df["montant"] = pd.to_numeric(
            transactions_df.get("montant", pd.Series([0] * len(transactions_df))),
            errors="coerce"
        ).fillna(0)

        stats = transactions_df.groupby("operateur").agg(
            volume_total=("montant", "sum"),
            commission_totale=("commission", "sum"),
            nb_transactions=("montant", "count"),
            ticket_moyen=("montant", "mean"),
        ).reset_index()

        total_commission = stats["commission_totale"].sum()
        stats["part_marche_pct"] = (
            (stats["commission_totale"] / total_commission * 100).round(1)
            if total_commission > 0 else 0.0
        )

        stats = stats.sort_values("commission_totale", ascending=False)

        return [
            {
                "operateur": str(row["operateur"]),
                "volume_total": round(float(row["volume_total"]), 2),
                "commission_totale": round(float(row["commission_totale"]), 2),
                "nb_transactions": int(row["nb_transactions"]),
                "ticket_moyen": round(float(row["ticket_moyen"]), 2),
                "part_marche_pct": float(row["part_marche_pct"]),
            }
            for _, row in stats.iterrows()
        ]

    def _default_best_hours(self) -> list[dict[str, Any]]:
        """Retourne un profil horaire type Mobile Money Afrique de l'Ouest."""
        profil = [
            (8, 120), (9, 150), (10, 140), (11, 130), (16, 125),
            (17, 140), (18, 160), (19, 145), (12, 110), (13, 100),
            (14, 95), (15, 105), (7, 80), (20, 90), (6, 50),
            (21, 60), (22, 40), (23, 25), (0, 15), (1, 10),
            (2, 5), (3, 5), (4, 5), (5, 20),
        ]
        return [
            {
                "heure": h,
                "commission_totale": c * 1000,
                "commission_moyenne": c * 10,
                "nb_transactions": c,
                "label": f"{h:02d}h00",
            }
            for h, c in profil
        ]


# Instance singleton
commission_optimizer = CommissionOptimizer()
