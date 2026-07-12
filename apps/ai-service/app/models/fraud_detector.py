"""
Modèle de détection de fraude basé sur Isolation Forest (scikit-learn).
Combine l'apprentissage automatique avec des règles métier Mobile Money africain.
Gère le cold start : si pas de données historiques, seules les règles métier s'appliquent.
"""
import os
import logging
from datetime import datetime
from typing import Any

import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)

# Features numériques utilisées pour l'entraînement Isolation Forest
FEATURE_COLUMNS = [
    "montant",
    "heure",
    "frequence_agent",       # Nombre de transactions de cet agent dans la dernière heure
    "ecart_montant_moyen",   # (montant - moyenne_agent) / std_agent
    "operateur_code",        # Encodage numérique de l'opérateur (MTN=1, Orange=2, Moov=3, ...)
    "type_transaction_code", # Encodage numérique du type (depot=1, retrait=2, transfert=3, ...)
    "jour_semaine",          # 0=lundi ... 6=dimanche
]


class FraudDetector:
    """
    Détecteur de fraude hybride :
    - Isolation Forest pour la détection d'anomalies statistiques
    - Règles métier fixes pour les patterns de fraude connus
    """

    def __init__(self) -> None:
        self.model: IsolationForest | None = None
        self.scaler: StandardScaler | None = None
        self.is_trained: bool = False
        self.agent_stats: dict[str, dict] = {}  # Cache des stats par agent

        # Paramètres Isolation Forest
        self._contamination = 0.05  # 5% de transactions supposées frauduleuses
        self._n_estimators = 100
        self._random_state = 42

    def _encode_operator(self, operateur: str) -> int:
        """Encode le nom de l'opérateur en entier pour le modèle ML."""
        mapping = {
            "MTN": 1, "ORANGE": 2, "MOOV": 3, "WAVE": 4,
            "AIRTEL": 5, "FREE": 6, "TOGOCEL": 7,
        }
        return mapping.get(operateur.upper() if operateur else "", 0)

    def _encode_type_transaction(self, type_tx: str) -> int:
        """Encode le type de transaction en entier."""
        mapping = {
            "DEPOT": 1, "RETRAIT": 2, "TRANSFERT": 3,
            "PAIEMENT": 4, "ACHAT_CREDIT": 5, "REMBOURSEMENT": 6,
        }
        return mapping.get(type_tx.upper() if type_tx else "", 0)

    def _extract_features(self, transaction: dict[str, Any]) -> np.ndarray:
        """
        Extrait et normalise les features d'une transaction pour le modèle.
        Retourne un vecteur numpy de dimension 7.
        """
        agent_id = transaction.get("agent_id", "")
        montant = float(transaction.get("montant", 0))
        heure = int(transaction.get("heure", datetime.now().hour))

        # Récupère les statistiques de l'agent depuis le cache
        stats = self.agent_stats.get(agent_id, {})
        frequence_agent = float(transaction.get("frequence_agent", stats.get("frequence_moyenne", 3)))
        moyenne_agent = stats.get("montant_moyen", montant)
        std_agent = stats.get("montant_std", max(montant * 0.5, 1))

        ecart_montant_moyen = (montant - moyenne_agent) / std_agent if std_agent > 0 else 0.0

        operateur_code = self._encode_operator(transaction.get("operateur", ""))
        type_tx_code = self._encode_type_transaction(transaction.get("type_transaction", ""))

        date_tx = transaction.get("date_transaction")
        if date_tx and isinstance(date_tx, datetime):
            jour_semaine = float(date_tx.weekday())
        else:
            jour_semaine = float(datetime.now().weekday())

        return np.array([[
            montant,
            float(heure),
            frequence_agent,
            ecart_montant_moyen,
            float(operateur_code),
            float(type_tx_code),
            jour_semaine,
        ]])

    def train(self, transactions_df: pd.DataFrame) -> None:
        """
        Entraîne le modèle Isolation Forest sur l'historique des transactions.
        Met à jour également les statistiques par agent pour les règles métier.

        Args:
            transactions_df: DataFrame avec colonnes [agent_id, montant, heure,
                             frequence_agent, operateur, type_transaction, date_transaction]
        """
        if transactions_df.empty or len(transactions_df) < 50:
            logger.warning(
                f"Données insuffisantes pour l'entraînement ({len(transactions_df)} lignes). "
                "Le modèle ML reste désactivé, seules les règles métier s'appliquent."
            )
            self._update_agent_stats(transactions_df)
            return

        logger.info(f"Entraînement du modèle sur {len(transactions_df)} transactions...")

        # Calcul des statistiques par agent
        self._update_agent_stats(transactions_df)

        # Construction du jeu de features
        features_list = []
        for _, row in transactions_df.iterrows():
            try:
                features = self._extract_features(row.to_dict())
                features_list.append(features[0])
            except Exception as e:
                logger.debug(f"Ligne ignorée lors de l'extraction des features : {e}")

        if len(features_list) < 50:
            logger.warning("Pas assez de features valides pour entraîner le modèle.")
            return

        X = np.array(features_list)

        # Normalisation
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        # Entraînement Isolation Forest
        self.model = IsolationForest(
            n_estimators=self._n_estimators,
            contamination=self._contamination,
            random_state=self._random_state,
            n_jobs=-1,
        )
        self.model.fit(X_scaled)
        self.is_trained = True

        logger.info("Modèle Isolation Forest entraîné avec succès.")

    def _update_agent_stats(self, transactions_df: pd.DataFrame) -> None:
        """Met à jour le cache des statistiques (moyenne, std, fréquence) par agent."""
        if transactions_df.empty or "agent_id" not in transactions_df.columns:
            return

        stats = transactions_df.groupby("agent_id")["montant"].agg(["mean", "std", "count"])
        for agent_id, row in stats.iterrows():
            self.agent_stats[str(agent_id)] = {
                "montant_moyen": float(row["mean"]),
                "montant_std": float(row["std"]) if not pd.isna(row["std"]) else 0.0,
                "frequence_moyenne": float(row["count"]) / max(1, 30),  # Normalisation sur 30 jours
            }

    def predict(self, transaction: dict[str, Any]) -> dict[str, Any]:
        """
        Analyse une transaction et retourne un score d'anomalie.

        Returns:
            dict avec :
                - ml_score: float entre 0 et 1 (1 = très suspect selon le modèle ML)
                - ml_prediction: int (-1=anomalie, 1=normal, 0=non entraîné)
                - raisons_ml: list[str] — raisons détectées par le modèle
        """
        raisons_ml: list[str] = []
        ml_prediction = 0
        ml_score = 0.0

        if self.is_trained and self.model is not None and self.scaler is not None:
            try:
                features = self._extract_features(transaction)
                features_scaled = self.scaler.transform(features)

                # predict : -1=anomalie, 1=normal
                ml_prediction = int(self.model.predict(features_scaled)[0])

                # score_samples : plus bas = plus anormal
                raw_score = float(self.model.score_samples(features_scaled)[0])

                # Normalisation du score entre 0 et 1 (valeurs typiques entre -0.5 et 0.5)
                ml_score = max(0.0, min(1.0, (0.5 - raw_score)))

                if ml_prediction == -1:
                    raisons_ml.append("Pattern statistiquement anormal détecté par le modèle IA")

            except Exception as e:
                logger.error(f"Erreur lors de la prédiction ML : {e}")

        return {
            "ml_score": ml_score,
            "ml_prediction": ml_prediction,
            "raisons_ml": raisons_ml,
        }

    def apply_business_rules(
        self,
        transaction: dict[str, Any],
        transactions_recentes: list[dict] | None = None,
    ) -> dict[str, Any]:
        """
        Applique les règles métier Mobile Money pour détecter les patterns connus.

        Args:
            transaction: La transaction à analyser
            transactions_recentes: Dernières transactions de cet agent (dernière heure)

        Returns:
            dict avec :
                - regles_score: int entre 0 et 100
                - regles_declenchees: list[str] — règles activées
        """
        montant = float(transaction.get("montant", 0))
        agent_id = str(transaction.get("agent_id", ""))
        heure = int(transaction.get("heure", datetime.now().hour))
        transactions_recentes = transactions_recentes or []

        regles_declenchees: list[str] = []
        regles_score = 0

        # Règle 1 : Montant > 5x la moyenne de l'agent
        stats = self.agent_stats.get(agent_id, {})
        moyenne_agent = stats.get("montant_moyen", 0)
        if moyenne_agent > 0 and montant > 5 * moyenne_agent:
            ratio = round(montant / moyenne_agent, 1)
            regles_declenchees.append(f"Montant {ratio}x supérieur à la moyenne de l'agent")
            regles_score += 35

        # Règle 2 : Plus de 20 transactions en 1 heure
        nb_recentes = len(transactions_recentes)
        if nb_recentes > 20:
            regles_declenchees.append(
                f"Volume anormal : {nb_recentes} transactions dans la dernière heure"
            )
            regles_score += 25

        # Règle 3 : Transaction entre 2h et 5h du matin
        if 2 <= heure < 5:
            regles_declenchees.append(f"Transaction à heure inhabituelle ({heure}h du matin)")
            regles_score += 20

        # Règle 4 : Même montant exact répété 3x en 10 minutes
        montants_recents = [
            float(tx.get("montant", 0))
            for tx in transactions_recentes
            if abs(float(tx.get("montant", 0)) - montant) < 1  # Tolérance de 1 XOF
        ]
        if len(montants_recents) >= 2:  # Avec la transaction actuelle, ça fait 3
            regles_declenchees.append(
                f"Montant identique ({montant} XOF) répété {len(montants_recents) + 1}x en peu de temps"
            )
            regles_score += 40

        return {
            "regles_score": min(regles_score, 100),
            "regles_declenchees": regles_declenchees,
        }

    def save_model(self, path: str) -> None:
        """Sérialise le modèle et le scaler sur disque avec joblib."""
        os.makedirs(path, exist_ok=True)
        if self.model is not None:
            joblib.dump(self.model, os.path.join(path, "fraud_isolation_forest.pkl"))
        if self.scaler is not None:
            joblib.dump(self.scaler, os.path.join(path, "fraud_scaler.pkl"))
        if self.agent_stats:
            joblib.dump(self.agent_stats, os.path.join(path, "fraud_agent_stats.pkl"))
        logger.info(f"Modèle sauvegardé dans {path}")

    def load_model(self, path: str) -> bool:
        """
        Charge un modèle pré-entraîné depuis le disque.
        Retourne True si le chargement est réussi, False sinon.
        """
        try:
            model_path = os.path.join(path, "fraud_isolation_forest.pkl")
            scaler_path = os.path.join(path, "fraud_scaler.pkl")
            stats_path = os.path.join(path, "fraud_agent_stats.pkl")

            if os.path.exists(model_path) and os.path.exists(scaler_path):
                self.model = joblib.load(model_path)
                self.scaler = joblib.load(scaler_path)
                self.is_trained = True
                if os.path.exists(stats_path):
                    self.agent_stats = joblib.load(stats_path)
                logger.info(f"Modèle chargé depuis {path}")
                return True
            else:
                logger.info("Aucun modèle pré-entraîné trouvé. Démarrage en mode règles métier uniquement.")
                return False
        except Exception as e:
            logger.error(f"Erreur lors du chargement du modèle : {e}")
            return False


# Instance singleton partagée par le service
fraud_detector = FraudDetector()
