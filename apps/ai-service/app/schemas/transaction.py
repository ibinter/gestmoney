"""
Schémas Pydantic pour les transactions Mobile Money.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TransactionBase(BaseModel):
    """Attributs communs à toutes les transactions."""
    agent_id: str = Field(..., description="Identifiant unique de l'agent Mobile Money")
    montant: float = Field(..., gt=0, description="Montant de la transaction en XOF")
    operateur: str = Field(..., description="Opérateur (MTN, ORANGE, MOOV, WAVE...)")
    type_transaction: str = Field(..., description="Type : DEPOT, RETRAIT, TRANSFERT, PAIEMENT...")
    heure: int = Field(default=0, ge=0, le=23, description="Heure de la transaction (0-23)")
    date_transaction: Optional[datetime] = Field(default=None, description="Date et heure complète")
    frequence_agent: Optional[int] = Field(
        default=None, description="Nb de transactions de cet agent dans la dernière heure"
    )
    tenant_id: Optional[str] = Field(default=None, description="Identifiant du tenant")
    agency_id: Optional[str] = Field(default=None, description="Identifiant de l'agence")
    reference: Optional[str] = Field(default=None, description="Référence externe de la transaction")
