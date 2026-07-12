"""
Fixtures partagées pytest — GESTMONEY AI Service
"""
from datetime import datetime, timedelta
from typing import Any

import pytest
import pandas as pd


# ─── Fixtures Transactions ────────────────────────────────────────────────────

@pytest.fixture
def transaction_normale() -> dict[str, Any]:
    """Transaction Mobile Money normale (aucun signal de fraude)."""
    return {
        "reference": "TXN-20260710-NORMAL1",
        "agent_id": "agent-uuid-1",
        "tenant_id": "tenant-1",
        "montant": 25000,          # Montant dans la moyenne de l'agent
        "heure": 10,               # 10h — heure normale de travail
        "operateur": "ORANGE",
        "type_transaction": "DEPOT",
        "frequence_agent": 3,      # 3 transactions / heure — normal
        "date_transaction": datetime(2026, 7, 10, 10, 30),
    }


@pytest.fixture
def transaction_suspecte() -> dict[str, Any]:
    """Transaction Mobile Money suspecte (montant élevé, heure inhabituelle)."""
    return {
        "reference": "TXN-20260710-SUSP01",
        "agent_id": "agent-uuid-1",
        "tenant_id": "tenant-1",
        "montant": 900000,         # 6x la moyenne de l'agent (150 000)
        "heure": 3,                # 3h du matin — heure suspecte
        "operateur": "MTN",
        "type_transaction": "RETRAIT",
        "frequence_agent": 25,     # 25 transactions / heure — anormal
        "date_transaction": datetime(2026, 7, 10, 3, 15),
    }


@pytest.fixture
def transaction_montant_eleve() -> dict[str, Any]:
    """Transaction avec montant très élevé par rapport à la moyenne de l'agent."""
    return {
        "reference": "TXN-20260710-HGAMT1",
        "agent_id": "agent-uuid-2",
        "tenant_id": "tenant-1",
        "montant": 1_200_000,      # Montant très élevé
        "heure": 14,               # Heure normale
        "operateur": "ORANGE",
        "type_transaction": "TRANSFERT",
        "frequence_agent": 2,
        "date_transaction": datetime(2026, 7, 10, 14, 0),
    }


@pytest.fixture
def transaction_heure_nuit() -> dict[str, Any]:
    """Transaction à 3h du matin."""
    return {
        "reference": "TXN-20260710-NIGHT1",
        "agent_id": "agent-uuid-3",
        "tenant_id": "tenant-1",
        "montant": 10000,
        "heure": 3,
        "operateur": "WAVE",
        "type_transaction": "DEPOT",
        "frequence_agent": 1,
        "date_transaction": datetime(2026, 7, 10, 3, 45),
    }


@pytest.fixture
def transactions_recentes_normales() -> list[dict[str, Any]]:
    """Liste de transactions récentes (dernière heure) pour un agent normal."""
    return [
        {
            "montant": 20000,
            "heure": 10,
            "type_transaction": "DEPOT",
        },
        {
            "montant": 30000,
            "heure": 10,
            "type_transaction": "DEPOT",
        },
        {
            "montant": 25000,
            "heure": 10,
            "type_transaction": "RETRAIT",
        },
    ]


@pytest.fixture
def transactions_recentes_suspectes() -> list[dict[str, Any]]:
    """Liste de transactions récentes suspectes (volume élevé + même montant répété)."""
    transactions = []
    # 22 transactions en 1 heure → volume anormal
    for i in range(22):
        transactions.append({
            "montant": 50000,   # Même montant exact répété
            "heure": 3,
            "type_transaction": "RETRAIT",
        })
    return transactions


# ─── Fixtures Historique Float ─────────────────────────────────────────────────

@pytest.fixture
def historique_float_30_jours() -> list[dict[str, Any]]:
    """
    Historique de float sur 30 jours pour un agent Orange Money.
    Profil : forte activité en journée, faible la nuit.
    """
    data = []
    base_date = datetime.now() - timedelta(days=30)

    for day in range(30):
        current_date = base_date + timedelta(days=day)
        for hour in range(24):
            # Profil d'activité : plus fort entre 8h et 18h
            if 8 <= hour <= 18:
                montant = 80000 + (hour - 8) * 5000  # Monte de 8h à 13h, descend de 13h à 18h
                if hour > 13:
                    montant = 80000 + (18 - hour) * 5000
            else:
                montant = 10000  # Faible activité la nuit

            data.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "heure": hour,
                "date_heure": current_date + timedelta(hours=hour),
                "montant_cumul_float": float(montant),
                "volume_transactions": max(1, montant // 10000),
                "agent_id": "agent-uuid-1",
                "operateur": "ORANGE",
                "jour_semaine": current_date.weekday(),
            })

    return data


@pytest.fixture
def historique_float_vide() -> list[dict[str, Any]]:
    """Historique vide — cas cold start."""
    return []


@pytest.fixture
def historique_float_insuffisant() -> list[dict[str, Any]]:
    """Historique trop court (3 points) — cold start partiel."""
    return [
        {"date": "2026-07-08", "heure": 10, "date_heure": datetime(2026, 7, 8, 10), "montant_cumul_float": 50000.0},
        {"date": "2026-07-09", "heure": 10, "date_heure": datetime(2026, 7, 9, 10), "montant_cumul_float": 55000.0},
        {"date": "2026-07-10", "heure": 10, "date_heure": datetime(2026, 7, 10, 10), "montant_cumul_float": 60000.0},
    ]


# ─── Fixtures Fraud Detector (entraîné) ──────────────────────────────────────

@pytest.fixture
def trained_fraud_detector():
    """
    Instance de FraudDetector entraînée sur 100 transactions synthétiques.
    Utilise inject de stats manuelles pour éviter d'entraîner le modèle complet.
    """
    from app.models.fraud_detector import FraudDetector

    detector = FraudDetector()

    # Injection de stats agent sans entraîner le modèle ML complet
    detector.agent_stats = {
        "agent-uuid-1": {
            "montant_moyen": 150_000.0,
            "montant_std": 30_000.0,
            "frequence_moyenne": 3.0,
        },
        "agent-uuid-2": {
            "montant_moyen": 200_000.0,
            "montant_std": 50_000.0,
            "frequence_moyenne": 5.0,
        },
    }

    # is_trained reste False → seules les règles métier s'appliquent
    return detector
