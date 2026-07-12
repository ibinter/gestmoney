"""
Schémas Pydantic pour la détection de fraude.
"""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.transaction import TransactionBase


class NiveauRisque(str, Enum):
    """Niveaux de risque de fraude."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class StatutAlerte(str, Enum):
    ACTIVE = "ACTIVE"
    RESOLUE = "RESOLUE"
    FAUX_POSITIF = "FAUX_POSITIF"


class TransactionInput(TransactionBase):
    """Transaction soumise à l'analyse anti-fraude."""
    transactions_recentes: Optional[list[dict]] = Field(
        default=None,
        description="Dernières transactions de cet agent (pour les règles métier)"
    )


class FraudScore(BaseModel):
    """Résultat de l'analyse anti-fraude pour une transaction."""
    transaction_reference: Optional[str] = None
    agent_id: str
    score: int = Field(..., ge=0, le=100, description="Score de risque (0=sûr, 100=fraude certaine)")
    niveau_risque: NiveauRisque
    raisons: list[str] = Field(default_factory=list, description="Explications du score")
    alerte_creee: bool = Field(default=False, description="Une alerte a-t-elle été sauvegardée en base ?")
    duree_analyse_ms: Optional[float] = None
    analyse_le: datetime = Field(default_factory=datetime.now)


class FraudAlert(BaseModel):
    """Alerte fraude persistée en base de données."""
    id: Optional[str] = None
    tenant_id: str
    agent_id: str
    transaction_reference: Optional[str] = None
    score: int
    niveau_risque: NiveauRisque
    raisons: list[str]
    statut: StatutAlerte = StatutAlerte.ACTIVE
    cree_le: datetime = Field(default_factory=datetime.now)
    resolu_le: Optional[datetime] = None
    resolu_par: Optional[str] = None
    commentaire_resolution: Optional[str] = None


class FraudAlertResolveRequest(BaseModel):
    """Requête pour résoudre une alerte fraude."""
    statut: StatutAlerte = StatutAlerte.RESOLUE
    commentaire: Optional[str] = Field(default=None, description="Commentaire de résolution")
    resolu_par: Optional[str] = Field(default=None, description="Utilisateur qui résout l'alerte")


class FraudStats(BaseModel):
    """Statistiques globales du module anti-fraude."""
    tenant_id: str
    periode_jours: int = 30
    nb_alertes_total: int
    nb_alertes_actives: int
    nb_alertes_resolues: int
    nb_faux_positifs: int
    montant_total_a_risque: float = Field(description="Somme des montants des transactions suspectes (XOF)")
    taux_detection_pct: float = Field(description="% transactions analysées ayant déclenché une alerte")
    repartition_par_niveau: dict[str, int] = Field(
        description="Nombre d'alertes par niveau : LOW, MEDIUM, HIGH, CRITICAL"
    )
    top_agents_suspects: list[dict] = Field(
        default_factory=list,
        description="Top 5 agents avec le plus d'alertes"
    )


class BatchTransactionInput(BaseModel):
    """Requête d'analyse en lot."""
    transactions: list[TransactionInput] = Field(
        ..., min_length=1, max_length=500,
        description="Liste de transactions à analyser (max 500)"
    )


class BatchFraudResult(BaseModel):
    """Résultat d'une analyse en lot."""
    nb_analysees: int
    nb_alertes: int
    resultats: list[FraudScore]
    duree_totale_ms: float
