"""
Schémas Pydantic pour les prévisions de float et de transactions.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ForecastRequest(BaseModel):
    """Requête générique de prévision."""
    agent_id: Optional[str] = None
    operator: Optional[str] = None
    network_id: Optional[str] = None
    agency_id: Optional[str] = None
    tenant_id: Optional[str] = None
    historique_jours: int = Field(default=28, ge=1, le=365)


class ForecastResult(BaseModel):
    """Prévision de float sur 24h."""
    agent_id: str
    operator: str
    previsions: dict[str, float] = Field(
        description="Clé=label heure 'YYYY-MM-DD HH:00', Valeur=float prévu en XOF"
    )
    alertes: list[str] = Field(default_factory=list)
    confiance: float = Field(ge=0.0, le=1.0)
    nb_points_historique: int = 0
    genere_le: datetime = Field(default_factory=datetime.now)


class ReplenishmentForecast(BaseModel):
    """Prévision des besoins de rechargement float sur N jours."""
    agent_id: str
    operator: str
    besoins_journaliers: dict[str, float] = Field(
        description="Clé=date 'YYYY-MM-DD', Valeur=besoin estimé en XOF"
    )
    total_estime: float = Field(description="Total à provisionner sur la période (XOF)")
    recommandation: str
    confiance: float = Field(ge=0.0, le=1.0)
    genere_le: datetime = Field(default_factory=datetime.now)


class NetworkForecastResult(BaseModel):
    """Prévision agrégée pour l'ensemble du réseau."""
    network_id: str
    nb_agents: int
    previsions_agregees: dict[str, float]
    agents_en_alerte: list[str] = Field(
        default_factory=list,
        description="Agents dont le float prévu passe sous le seuil"
    )
    confiance_moyenne: float
    genere_le: datetime = Field(default_factory=datetime.now)


class TransactionVolumeForecast(BaseModel):
    """Prévision du volume de transactions par agence."""
    agency_id: str
    previsions_volume: dict[str, int] = Field(
        description="Clé=label heure, Valeur=nombre de transactions prévu"
    )
    previsions_montant: dict[str, float] = Field(
        description="Clé=label heure, Valeur=montant total prévu en XOF"
    )
    confiance: float
    genere_le: datetime = Field(default_factory=datetime.now)


class RevenueForecast(BaseModel):
    """Prévision des revenus en commissions sur 7 jours."""
    network_id: str
    previsions_commissions: dict[str, float] = Field(
        description="Clé=date, Valeur=commission prévue en XOF"
    )
    total_estime_7j: float
    comparaison_semaine_precedente_pct: Optional[float] = Field(
        default=None,
        description="Variation vs semaine précédente en %"
    )
    confiance: float
    genere_le: datetime = Field(default_factory=datetime.now)
