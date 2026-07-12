"""
Tests unitaires — FloatForecaster
"""
import pytest
from datetime import datetime
from unittest.mock import patch

from app.models.float_forecaster import FloatForecaster


class TestFloatForecasterWithHistory:
    """Tests avec historique disponible."""

    def test_forecast_next_24h_retourne_24_points(self, historique_float_30_jours):
        """La prévision 24h doit contenir exactement 24 points horaires."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_next_24h(
            agent_id="agent-uuid-1",
            operator="ORANGE",
            historical_data=historique_float_30_jours,
        )

        assert "previsions" in result
        assert len(result["previsions"]) == 24

    def test_forecast_next_24h_structure_complete(self, historique_float_30_jours):
        """La structure de retour doit contenir toutes les clés attendues."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_next_24h("agent-uuid-1", "ORANGE", historique_float_30_jours)

        assert "previsions" in result
        assert "alertes" in result
        assert "confiance" in result
        assert "nb_points_historique" in result
        assert isinstance(result["previsions"], dict)
        assert isinstance(result["alertes"], list)
        assert isinstance(result["confiance"], float)

    def test_forecast_confiance_superieure_zero_avec_historique(self, historique_float_30_jours):
        """Avec un historique riche, la confiance doit être > 0."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_next_24h("agent-uuid-1", "ORANGE", historique_float_30_jours)

        assert result["confiance"] > 0.0

    def test_forecast_confiance_bornee_entre_0_et_1(self, historique_float_30_jours):
        """La confiance doit être bornée entre 0 et 1."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_next_24h("agent-uuid-1", "ORANGE", historique_float_30_jours)

        assert 0.0 <= result["confiance"] <= 1.0

    def test_forecast_valeurs_positives(self, historique_float_30_jours):
        """Toutes les valeurs de prévision doivent être >= 0."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_next_24h("agent-uuid-1", "ORANGE", historique_float_30_jours)

        for heure, valeur in result["previsions"].items():
            assert valeur >= 0.0, f"Valeur négative pour {heure}: {valeur}"

    def test_forecast_agent_et_operator_dans_retour(self, historique_float_30_jours):
        """L'agent_id et operator doivent être retournés dans le résultat."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_next_24h("agent-uuid-1", "ORANGE", historique_float_30_jours)

        assert result["agent_id"] == "agent-uuid-1"
        assert result["operator"] == "ORANGE"


class TestFloatForecasterColdStart:
    """Tests du comportement en cold start (pas d'historique)."""

    def test_forecast_cold_start_retourne_24_points(self, historique_float_vide):
        """Même en cold start, la prévision doit contenir 24 points."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_next_24h("agent-uuid-1", "ORANGE", historique_float_vide)

        assert len(result["previsions"]) == 24

    def test_forecast_cold_start_confiance_zero(self, historique_float_vide):
        """En cold start, la confiance doit être 0.0."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_next_24h("agent-uuid-1", "ORANGE", historique_float_vide)

        assert result["confiance"] == 0.0

    def test_forecast_cold_start_contient_alerte(self, historique_float_vide):
        """En cold start, une alerte explicative doit être présente."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_next_24h("agent-uuid-1", "ORANGE", historique_float_vide)

        assert len(result["alertes"]) > 0
        assert any("cold start" in a.lower() or "insuffisant" in a.lower() for a in result["alertes"])

    def test_forecast_cold_start_valeurs_positives(self, historique_float_vide):
        """En cold start, les valeurs doivent quand même être positives (profil type)."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_next_24h("agent-uuid-1", "ORANGE", historique_float_vide)

        for valeur in result["previsions"].values():
            assert valeur >= 0.0

    def test_forecast_cold_start_nb_points_zero(self, historique_float_vide):
        """En cold start, nb_points_historique doit être 0."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_next_24h("agent-uuid-1", "ORANGE", historique_float_vide)

        assert result["nb_points_historique"] == 0


class TestFloatForecasterReplenishmentNeed:
    """Tests de forecast_replenishment_need()."""

    def test_replenishment_retourne_7_jours_par_defaut(self, historique_float_30_jours):
        """Par défaut, les besoins sont estimés sur 7 jours."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_replenishment_need(
            "agent-uuid-1", "ORANGE", historique_float_30_jours
        )

        assert len(result["besoins_journaliers"]) == 7

    def test_replenishment_retourne_n_jours_si_specifie(self, historique_float_30_jours):
        """Le nombre de jours doit correspondre au paramètre days."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_replenishment_need(
            "agent-uuid-1", "ORANGE", historique_float_30_jours, days=14
        )

        assert len(result["besoins_journaliers"]) == 14

    def test_replenishment_total_calcule_correctement(self, historique_float_30_jours):
        """Le total estimé doit être la somme des besoins journaliers."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_replenishment_need(
            "agent-uuid-1", "ORANGE", historique_float_30_jours
        )

        total_calcule = sum(result["besoins_journaliers"].values())
        assert abs(result["total_estime"] - total_calcule) < 1.0  # Tolérance arrondi

    def test_replenishment_cold_start_sans_historique(self, historique_float_vide):
        """En cold start, un montant par défaut basé sur le seuil minimum est retourné."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_replenishment_need(
            "agent-uuid-1", "ORANGE", historique_float_vide
        )

        assert result["total_estime"] > 0
        assert "recommandation" in result
        assert result["confiance"] < 0.5  # Faible confiance sans historique

    def test_replenishment_valeurs_positives(self, historique_float_30_jours):
        """Toutes les valeurs de besoin journalier doivent être >= 0."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_replenishment_need(
            "agent-uuid-1", "ORANGE", historique_float_30_jours
        )

        for date, besoin in result["besoins_journaliers"].items():
            assert besoin >= 0.0, f"Besoin négatif pour {date}: {besoin}"

    def test_replenishment_recommandation_presente(self, historique_float_30_jours):
        """Une recommandation textuelle doit toujours être présente."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_replenishment_need(
            "agent-uuid-1", "ORANGE", historique_float_30_jours
        )

        assert "recommandation" in result
        assert len(result["recommandation"]) > 0

    def test_replenishment_structure_complete(self, historique_float_30_jours):
        """La structure de retour doit contenir toutes les clés attendues."""
        forecaster = FloatForecaster()
        result = forecaster.forecast_replenishment_need(
            "agent-uuid-1", "ORANGE", historique_float_30_jours
        )

        assert "agent_id" in result
        assert "operator" in result
        assert "besoins_journaliers" in result
        assert "total_estime" in result
        assert "recommandation" in result
        assert "confiance" in result


class TestFloatForecasterTrend:
    """Tests du calcul de tendance."""

    def test_compute_trend_serie_croissante(self):
        """Une série croissante doit avoir une tendance positive."""
        import pandas as pd
        forecaster = FloatForecaster()
        series = pd.Series([10000, 20000, 30000, 40000, 50000])
        trend = forecaster._compute_trend(series)
        assert trend > 0

    def test_compute_trend_serie_decroissante(self):
        """Une série décroissante doit avoir une tendance négative."""
        import pandas as pd
        forecaster = FloatForecaster()
        series = pd.Series([50000, 40000, 30000, 20000, 10000])
        trend = forecaster._compute_trend(series)
        assert trend < 0

    def test_compute_trend_un_seul_point(self):
        """Avec un seul point, la tendance doit être 0."""
        import pandas as pd
        forecaster = FloatForecaster()
        series = pd.Series([50000])
        trend = forecaster._compute_trend(series)
        assert trend == 0.0
