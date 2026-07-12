"""
Schémas Pydantic pour les anomalies opérationnelles.
"""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class TypeAnomalie(str, Enum):
    ANOMALIE_RESEAU = "ANOMALIE_RESEAU"
    AGENT_INACTIF = "AGENT_INACTIF"
    ANOMALIE_FINANCIERE = "ANOMALIE_FINANCIERE"


class SeveriteAnomalie(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class StatutAnomalie(str, Enum):
    ACTIVE = "ACTIVE"
    ACQUITTEE = "ACQUITTEE"
    RESOLUE = "RESOLUE"


class AnomalyRecord(BaseModel):
    """Anomalie détectée et persistée."""
    id: Optional[str] = None
    type: TypeAnomalie
    severite: SeveriteAnomalie
    tenant_id: Optional[str] = None
    agent_id: Optional[str] = None
    description: str
    statut: StatutAnomalie = StatutAnomalie.ACTIVE
    donnees_supplementaires: dict = Field(default_factory=dict)
    detecte_a: datetime = Field(default_factory=datetime.now)
    acquitte_le: Optional[datetime] = None
    acquitte_par: Optional[str] = None


class AnomalyAcknowledgeRequest(BaseModel):
    """Requête d'acquittement d'une anomalie."""
    acquitte_par: str = Field(..., description="Identifiant de l'utilisateur qui acquitte")
    commentaire: Optional[str] = None


class NetworkAnomalyInput(BaseModel):
    """Données pour vérification d'anomalie réseau."""
    volume_actuel: int = Field(..., ge=0)
    volumes_historiques: list[int] = Field(..., min_length=1)
    tenant_id: str
    fenetre_label: str = "dernière heure"


class AgentInactivityInput(BaseModel):
    """Données pour vérification d'inactivité agent."""
    agent_id: str
    heure_actuelle: int = Field(..., ge=0, le=23)
    a_des_transactions_aujourd_hui: bool
    heures_habituelles: Optional[list[int]] = None


class CashDiscrepancyInput(BaseModel):
    """Données pour vérification d'écart de caisse."""
    agent_id: str
    solde_theorique: float
    solde_physique: float
    tenant_id: Optional[str] = None
