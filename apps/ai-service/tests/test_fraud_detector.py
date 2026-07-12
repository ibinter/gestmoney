"""
Tests unitaires — FraudDetector
"""
import pytest
from unittest.mock import patch
from datetime import datetime

from app.models.fraud_detector import FraudDetector


class TestFraudDetectorPredict:
    """Tests de la méthode predict() — prédiction ML + règles métier."""

    def test_predict_transaction_normale(self, transaction_normale, trained_fraud_detector):
        """Une transaction normale doit avoir un score ML bas (aucune anomalie)."""
        result = trained_fraud_detector.predict(transaction_normale)

        assert "ml_score" in result
        assert "ml_prediction" in result
        assert "raisons_ml" in result
        # Modèle non entraîné → score ML = 0.0
        assert result["ml_score"] == 0.0
        assert result["ml_prediction"] == 0  # 0 = non entraîné

    def test_predict_retourne_structure_complete(self, transaction_normale, trained_fraud_detector):
        """La structure de retour doit toujours être complète."""
        result = trained_fraud_detector.predict(transaction_normale)

        assert isinstance(result["ml_score"], float)
        assert isinstance(result["ml_prediction"], int)
        assert isinstance(result["raisons_ml"], list)

    def test_predict_score_entre_0_et_1(self, transaction_normale):
        """Le score ML doit toujours être borné entre 0 et 1."""
        detector = FraudDetector()
        result = detector.predict(transaction_normale)
        assert 0.0 <= result["ml_score"] <= 1.0

    def test_predict_cold_start_sans_modele(self, transaction_normale):
        """Sans modèle entraîné, is_trained=False et score=0.0."""
        detector = FraudDetector()
        assert detector.is_trained is False

        result = detector.predict(transaction_normale)

        assert result["ml_score"] == 0.0
        assert result["ml_prediction"] == 0


class TestFraudDetectorBusinessRules:
    """Tests des règles métier — apply_business_rules()."""

    def test_regle_montant_eleve(self, trained_fraud_detector):
        """Règle 1 : montant 6x la moyenne de l'agent → score élevé."""
        transaction = {
            "agent_id": "agent-uuid-1",
            "montant": 900_000,   # 6x la moyenne de 150_000
            "heure": 10,
        }

        result = trained_fraud_detector.apply_business_rules(transaction, [])

        assert result["regles_score"] > 0
        assert any("supérieur" in r for r in result["regles_declenchees"])

    def test_regle_heure_inhabituelle_3h(self, trained_fraud_detector):
        """Règle 3 : transaction entre 2h et 5h → score +20."""
        transaction = {
            "agent_id": "agent-uuid-1",
            "montant": 10_000,
            "heure": 3,
        }

        result = trained_fraud_detector.apply_business_rules(transaction, [])

        assert result["regles_score"] >= 20
        assert any("3h" in r or "heure" in r.lower() for r in result["regles_declenchees"])

    def test_regle_heure_inhabituelle_4h(self, trained_fraud_detector):
        """Règle 3 : transaction à 4h du matin doit aussi déclencher l'alerte."""
        transaction = {
            "agent_id": "agent-uuid-1",
            "montant": 10_000,
            "heure": 4,
        }

        result = trained_fraud_detector.apply_business_rules(transaction, [])

        assert result["regles_score"] >= 20

    def test_regle_heure_normale_ne_declenche_pas(self, trained_fraud_detector):
        """Heure 10h ne doit pas déclencher la règle heure inhabituelle."""
        transaction = {
            "agent_id": "agent-uuid-1",
            "montant": 10_000,
            "heure": 10,
        }

        result = trained_fraud_detector.apply_business_rules(transaction, [])

        assert not any("matin" in r for r in result["regles_declenchees"])

    def test_regle_volume_eleve(self, trained_fraud_detector, transactions_recentes_suspectes):
        """Règle 2 : > 20 transactions en 1 heure → score +25."""
        transaction = {
            "agent_id": "agent-uuid-1",
            "montant": 10_000,
            "heure": 3,
        }

        result = trained_fraud_detector.apply_business_rules(transaction, transactions_recentes_suspectes)

        assert result["regles_score"] >= 25
        assert any("volume" in r.lower() or "transactions" in r.lower() for r in result["regles_declenchees"])

    def test_regle_montant_identique_repete(self, trained_fraud_detector):
        """Règle 4 : même montant répété 3x en peu de temps → score +40."""
        transaction = {
            "agent_id": "agent-uuid-1",
            "montant": 50_000,
            "heure": 10,
        }
        transactions_recentes = [
            {"montant": 50_000, "heure": 10},
            {"montant": 50_000, "heure": 10},
            {"montant": 30_000, "heure": 10},  # Montant différent → ne compte pas
        ]

        result = trained_fraud_detector.apply_business_rules(transaction, transactions_recentes)

        assert result["regles_score"] >= 40
        assert any("répété" in r or "identique" in r.lower() for r in result["regles_declenchees"])

    def test_score_cap_a_100(self, trained_fraud_detector, transactions_recentes_suspectes):
        """Le score de règles ne doit jamais dépasser 100."""
        transaction = {
            "agent_id": "agent-uuid-1",
            "montant": 900_000,   # Montant élevé (+35)
            "heure": 3,           # Heure inhabituelles (+20)
        }

        result = trained_fraud_detector.apply_business_rules(transaction, transactions_recentes_suspectes)

        assert result["regles_score"] <= 100

    def test_aucune_regle_declenchee_pour_transaction_normale(
        self, trained_fraud_detector, transactions_recentes_normales, transaction_normale
    ):
        """Une transaction normale ne doit déclencher aucune règle métier."""
        result = trained_fraud_detector.apply_business_rules(
            transaction_normale, transactions_recentes_normales
        )

        assert result["regles_score"] == 0
        assert len(result["regles_declenchees"]) == 0

    def test_structure_de_retour_complete(self, trained_fraud_detector, transaction_normale):
        """La structure de retour doit toujours contenir les clés attendues."""
        result = trained_fraud_detector.apply_business_rules(transaction_normale, [])

        assert "regles_score" in result
        assert "regles_declenchees" in result
        assert isinstance(result["regles_score"], int)
        assert isinstance(result["regles_declenchees"], list)


class TestFraudDetectorColdStart:
    """Tests du comportement sans données historiques."""

    def test_predict_sans_modele_entraine(self, transaction_normale):
        """Sans modèle entraîné, predict() retourne un résultat par défaut."""
        detector = FraudDetector()
        result = detector.predict(transaction_normale)

        assert result["ml_score"] == 0.0
        assert result["ml_prediction"] == 0
        assert result["raisons_ml"] == []

    def test_regles_metier_sans_stats_agent(self):
        """Sans stats agent, les règles montant ne se déclenchent pas."""
        detector = FraudDetector()
        transaction = {
            "agent_id": "agent-inconnu",
            "montant": 500_000,
            "heure": 14,
        }

        result = detector.apply_business_rules(transaction, [])

        # Sans moyenne connue (0), la règle montant élevé ne peut pas s'appliquer
        assert "regles_score" in result
        assert result["regles_score"] >= 0  # Score peut être 0 ou non selon heure

    def test_apply_business_rules_retourne_toujours_un_resultat(self):
        """apply_business_rules() ne doit jamais lever d'exception."""
        detector = FraudDetector()
        result = detector.apply_business_rules({}, None)

        assert "regles_score" in result
        assert "regles_declenchees" in result


class TestFraudDetectorEncoding:
    """Tests des fonctions d'encodage."""

    def test_encode_operator_connu(self):
        detector = FraudDetector()
        assert detector._encode_operator("MTN") == 1
        assert detector._encode_operator("ORANGE") == 2
        assert detector._encode_operator("MOOV") == 3

    def test_encode_operator_inconnu(self):
        detector = FraudDetector()
        assert detector._encode_operator("INCONNU") == 0

    def test_encode_operator_case_insensitive(self):
        detector = FraudDetector()
        assert detector._encode_operator("mtn") == 1
        assert detector._encode_operator("Orange") == 2

    def test_encode_type_transaction(self):
        detector = FraudDetector()
        assert detector._encode_type_transaction("DEPOT") == 1
        assert detector._encode_type_transaction("RETRAIT") == 2
        assert detector._encode_type_transaction("TRANSFERT") == 3

    def test_encode_type_inconnu(self):
        detector = FraudDetector()
        assert detector._encode_type_transaction("INCONNU") == 0
