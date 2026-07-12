"""
Tests unitaires — FraudService (analyze_transaction)
Teste la fusion ML + règles métier, les seuils de risque et la population des raisons.
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime

from app.services.fraud_service import (
    analyze_transaction,
    _compute_final_score,
    _score_to_niveau,
)
from app.schemas.fraud import NiveauRisque


# ─── Tests _score_to_niveau() ────────────────────────────────────────────────

class TestScoreToNiveau:
    """Vérifie la conversion score numérique → niveau de risque catégoriel."""

    def test_score_0_est_low(self):
        assert _score_to_niveau(0) == NiveauRisque.LOW

    def test_score_29_est_low(self):
        assert _score_to_niveau(29) == NiveauRisque.LOW

    def test_score_30_est_medium(self):
        assert _score_to_niveau(30) == NiveauRisque.MEDIUM

    def test_score_59_est_medium(self):
        assert _score_to_niveau(59) == NiveauRisque.MEDIUM

    def test_score_60_est_high(self):
        assert _score_to_niveau(60) == NiveauRisque.HIGH

    def test_score_79_est_high(self):
        assert _score_to_niveau(79) == NiveauRisque.HIGH

    def test_score_80_est_critical(self):
        assert _score_to_niveau(80) == NiveauRisque.CRITICAL

    def test_score_100_est_critical(self):
        assert _score_to_niveau(100) == NiveauRisque.CRITICAL


# ─── Tests _compute_final_score() ────────────────────────────────────────────

class TestComputeFinalScore:
    """Vérifie la fusion des scores ML et règles métier."""

    def test_sans_modele_entraine_score_egal_regles(self):
        """Sans modèle ML, le score final = score règles métier (100% règles)."""
        with patch("app.services.fraud_service.fraud_detector") as mock_detector:
            mock_detector.is_trained = False
            score = _compute_final_score(ml_score=0.9, regles_score=45)
        assert score == 45

    def test_avec_modele_entraine_fusion_40_60(self):
        """Avec modèle ML : 40% ML + 60% règles métier."""
        with patch("app.services.fraud_service.fraud_detector") as mock_detector:
            mock_detector.is_trained = True
            # 40% de (0.8 * 100 = 80) + 60% de 50 = 32 + 30 = 62
            score = _compute_final_score(ml_score=0.8, regles_score=50)
        assert score == 62

    def test_score_plafonné_à_100(self):
        """Le score final ne peut pas dépasser 100."""
        with patch("app.services.fraud_service.fraud_detector") as mock_detector:
            mock_detector.is_trained = False
            score = _compute_final_score(ml_score=1.0, regles_score=150)
        assert score == 100

    def test_score_ml_seul_egal_zero_donne_score_regles(self):
        """Score ML à 0 → uniquement les règles métier comptent (sans modèle)."""
        with patch("app.services.fraud_service.fraud_detector") as mock_detector:
            mock_detector.is_trained = False
            score = _compute_final_score(ml_score=0.0, regles_score=75)
        assert score == 75


# ─── Tests analyze_transaction() ─────────────────────────────────────────────

class TestAnalyzeTransaction:
    """Tests de la fonction principale d'analyse de fraude."""

    @pytest.mark.asyncio
    async def test_score_faible_pour_transaction_normale(self, transaction_normale):
        """Une transaction normale doit produire un score < 30 (niveau LOW)."""
        with patch("app.services.fraud_service.fraud_detector") as mock_detector:
            mock_detector.is_trained = False
            mock_detector.predict.return_value = {
                "ml_score": 0.0,
                "ml_prediction": 0,
                "raisons_ml": [],
            }
            mock_detector.apply_business_rules.return_value = {
                "regles_score": 0,
                "regles_declenchees": [],
            }

            result = await analyze_transaction(transaction_normale)

        assert result.score < 30
        assert result.niveau_risque == NiveauRisque.LOW

    @pytest.mark.asyncio
    async def test_score_eleve_pour_transaction_suspecte(self, transaction_suspecte):
        """Une transaction suspecte (montant élevé + heure nocturne) doit produire un score >= 60."""
        with patch("app.services.fraud_service.fraud_detector") as mock_detector:
            mock_detector.is_trained = False
            mock_detector.predict.return_value = {
                "ml_score": 0.0,
                "ml_prediction": 0,
                "raisons_ml": [],
            }
            mock_detector.apply_business_rules.return_value = {
                "regles_score": 75,
                "regles_declenchees": [
                    "Montant supérieur à 6x la moyenne de l'agent",
                    "Transaction à une heure inhabituelle (3h du matin)",
                ],
            }

            result = await analyze_transaction(transaction_suspecte)

        assert result.score >= 60
        assert result.niveau_risque in (NiveauRisque.HIGH, NiveauRisque.CRITICAL)

    @pytest.mark.asyncio
    async def test_seuils_de_risque_respectes(self, transaction_normale):
        """Vérifie que chaque tranche de score produit le bon niveau de risque."""
        cas = [
            (0, NiveauRisque.LOW),
            (29, NiveauRisque.LOW),
            (30, NiveauRisque.MEDIUM),
            (59, NiveauRisque.MEDIUM),
            (60, NiveauRisque.HIGH),
            (79, NiveauRisque.HIGH),
            (80, NiveauRisque.CRITICAL),
            (100, NiveauRisque.CRITICAL),
        ]

        for score_regles, niveau_attendu in cas:
            with patch("app.services.fraud_service.fraud_detector") as mock_detector:
                mock_detector.is_trained = False
                mock_detector.predict.return_value = {
                    "ml_score": 0.0,
                    "ml_prediction": 0,
                    "raisons_ml": [],
                }
                mock_detector.apply_business_rules.return_value = {
                    "regles_score": score_regles,
                    "regles_declenchees": [],
                }

                result = await analyze_transaction(transaction_normale)

            assert result.niveau_risque == niveau_attendu, (
                f"Score {score_regles} devrait être {niveau_attendu}, "
                f"mais got {result.niveau_risque}"
            )

    @pytest.mark.asyncio
    async def test_raisons_toujours_peuplees(self, transaction_normale):
        """Le champ raisons ne doit jamais être vide — fallback sur 'Aucune anomalie détectée'."""
        with patch("app.services.fraud_service.fraud_detector") as mock_detector:
            mock_detector.is_trained = False
            mock_detector.predict.return_value = {
                "ml_score": 0.0,
                "ml_prediction": 0,
                "raisons_ml": [],
            }
            mock_detector.apply_business_rules.return_value = {
                "regles_score": 0,
                "regles_declenchees": [],
            }

            result = await analyze_transaction(transaction_normale)

        assert result.raisons is not None
        assert len(result.raisons) > 0
        assert result.raisons[0] == "Aucune anomalie détectée"

    @pytest.mark.asyncio
    async def test_raisons_peuplees_avec_anomalies(self, transaction_suspecte):
        """Quand des règles se déclenchent, les raisons doivent les inclure."""
        raisons_declenchees = [
            "Montant supérieur à 6x la moyenne",
            "Heure inhabituele : 3h du matin",
        ]

        with patch("app.services.fraud_service.fraud_detector") as mock_detector:
            mock_detector.is_trained = False
            mock_detector.predict.return_value = {
                "ml_score": 0.0,
                "ml_prediction": 0,
                "raisons_ml": [],
            }
            mock_detector.apply_business_rules.return_value = {
                "regles_score": 55,
                "regles_declenchees": raisons_declenchees,
            }

            result = await analyze_transaction(transaction_suspecte)

        assert "Montant supérieur à 6x la moyenne" in result.raisons
        assert "Heure inhabituele : 3h du matin" in result.raisons

    @pytest.mark.asyncio
    async def test_structure_fraud_score_complete(self, transaction_normale):
        """Le FraudScore retourné doit avoir tous les champs requis."""
        with patch("app.services.fraud_service.fraud_detector") as mock_detector:
            mock_detector.is_trained = False
            mock_detector.predict.return_value = {
                "ml_score": 0.0,
                "ml_prediction": 0,
                "raisons_ml": [],
            }
            mock_detector.apply_business_rules.return_value = {
                "regles_score": 0,
                "regles_declenchees": [],
            }

            result = await analyze_transaction(transaction_normale)

        assert hasattr(result, "score")
        assert hasattr(result, "niveau_risque")
        assert hasattr(result, "raisons")
        assert hasattr(result, "alerte_creee")
        assert hasattr(result, "duree_analyse_ms")
        assert hasattr(result, "analyse_le")
        assert isinstance(result.score, int)
        assert 0 <= result.score <= 100

    @pytest.mark.asyncio
    async def test_alerte_non_creee_sans_db(self, transaction_suspecte):
        """Sans session DB, alerte_creee doit être False même avec score élevé."""
        with patch("app.services.fraud_service.fraud_detector") as mock_detector, \
             patch("app.services.fraud_service.settings") as mock_settings:
            mock_detector.is_trained = False
            mock_settings.FRAUD_ALERT_THRESHOLD = 50
            mock_detector.predict.return_value = {
                "ml_score": 0.0,
                "ml_prediction": 0,
                "raisons_ml": [],
            }
            mock_detector.apply_business_rules.return_value = {
                "regles_score": 90,
                "regles_declenchees": ["Anomalie critique"],
            }

            result = await analyze_transaction(transaction_suspecte, db=None)

        assert result.alerte_creee is False

    @pytest.mark.asyncio
    async def test_duree_analyse_en_millisecondes(self, transaction_normale):
        """La durée d'analyse doit être exprimée en millisecondes (nombre positif)."""
        with patch("app.services.fraud_service.fraud_detector") as mock_detector:
            mock_detector.is_trained = False
            mock_detector.predict.return_value = {
                "ml_score": 0.0,
                "ml_prediction": 0,
                "raisons_ml": [],
            }
            mock_detector.apply_business_rules.return_value = {
                "regles_score": 0,
                "regles_declenchees": [],
            }

            result = await analyze_transaction(transaction_normale)

        assert result.duree_analyse_ms >= 0

    @pytest.mark.asyncio
    async def test_raisons_ml_fusionnees_avec_raisons_regles(self, transaction_suspecte):
        """Les raisons ML et les raisons règles doivent être fusionnées dans le résultat."""
        with patch("app.services.fraud_service.fraud_detector") as mock_detector:
            mock_detector.is_trained = True
            mock_detector.predict.return_value = {
                "ml_score": 0.85,
                "ml_prediction": 1,
                "raisons_ml": ["Score Isolation Forest élevé : 0.85"],
            }
            mock_detector.apply_business_rules.return_value = {
                "regles_score": 40,
                "regles_declenchees": ["Heure inhabituelle"],
            }

            result = await analyze_transaction(transaction_suspecte)

        assert "Score Isolation Forest élevé : 0.85" in result.raisons
        assert "Heure inhabituelle" in result.raisons
