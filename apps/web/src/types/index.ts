// ============================================================
// TYPES TYPESCRIPT — GESTMONEY
// ============================================================

// ---------- Authentification ----------
export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'super_admin' | 'SUPER_ADMIN' | 'admin' | 'ADMIN' | 'superviseur' | 'SUPERVISEUR' | 'agent' | 'AGENT' | 'caissier' | 'CAISSIER' | 'VIEWER';
  agenceId?: string;
  avatar?: string;
  actif: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ---------- Opérateurs Mobile Money ----------
export type Operateur = 'orange_money' | 'mtn_momo' | 'wave' | 'moov' | 'airtel';

export const OPERATEURS: Record<Operateur, { label: string; couleur: string; logo: string }> = {
  orange_money: { label: 'Orange Money', couleur: '#FF6600', logo: '🟠' },
  mtn_momo:     { label: 'MTN MoMo',     couleur: '#FFCC00', logo: '🟡' },
  wave:          { label: 'Wave',          couleur: '#1A9BDB', logo: '🔵' },
  moov:          { label: 'Moov',          couleur: '#0066CC', logo: '🔷' },
  airtel:        { label: 'Airtel',        couleur: '#CC0000', logo: '🔴' },
};

// ---------- Float ----------
export interface FloatSolde {
  id: string;
  operateur: Operateur;
  soldeActuel: number;
  seuilAlerte: number;
  seuilCritique: number;
  statut: 'ok' | 'alerte' | 'critique';
  derniereMaj: string;
  evolution: number[]; // 7 derniers jours
}

export interface MouvementFloat {
  id: string;
  type: 'entree' | 'sortie';
  operateur: Operateur;
  montant: number;
  description: string;
  soldeAvant: number;
  soldeApres: number;
  date: string;
  agentId: string;
}

export interface DemandeReapprovisionnement {
  id: string;
  operateur: Operateur;
  montant: number;
  statut: 'en_attente' | 'approuve' | 'rejete' | 'complete';
  demandeurId: string;
  demandeurNom: string;
  date: string;
  commentaire?: string;
}

// ---------- Transactions ----------
export type TypeTransaction =
  | 'depot'
  | 'retrait'
  | 'cash_in'
  | 'cash_out'
  | 'transfert'
  | 'paiement';

export type StatutTransaction = 'success' | 'pending' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  reference: string;
  type: TypeTransaction;
  operateur: Operateur;
  agentId: string;
  agentNom: string;
  agenceId: string;
  agenceNom: string;
  clientNom?: string;
  clientTel?: string;
  montant: number;
  frais: number;
  commission: number;
  statut: StatutTransaction;
  date: string;
  description?: string;
}

// ---------- Agents ----------
export interface Agent {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  agenceId: string;
  agenceNom: string;
  actif: boolean;
  enLigne: boolean;
  nbTransactionsAujourdhui: number;
  montantTransactionsAujourdhui: number;
  commission: number;
  createdAt: string;
}

// ---------- Agences ----------
export interface Agence {
  id: string;
  nom: string;
  code: string;
  ville: string;
  adresse: string;
  telephone: string;
  responsableId: string;
  responsableNom: string;
  nbAgents: number;
  nbAgentsEnLigne: number;
  active: boolean;
  createdAt: string;
}

// ---------- Commissions ----------
export interface Commission {
  id: string;
  agentId: string;
  agentNom: string;
  agenceId: string;
  agenceNom: string;
  periode: string; // "2024-01"
  nbTransactions: number;
  montantTransactions: number;
  tauxCommission: number;
  montantCommission: number;
  statut: 'calculee' | 'validee' | 'payee';
  datePaiement?: string;
}

// ---------- Dashboard Stats ----------
export interface DashboardStats {
  transactions: {
    nbAujourdhui: number;
    montantAujourdhui: number;
    variationPct: number;
    enAttente: number;
  };
  caisse: {
    soldeActuel: number;
    entrees: number;
    sorties: number;
    ecart: number;
  };
  float: {
    soldes: FloatSolde[];
    alertes: number;
  };
  performances: {
    chiffreAffaires: number;
    objectif: number;
    progressionPct: number;
    topAgent: { nom: string; montant: number };
  };
  agences: {
    nbActives: number;
    nbTotal: number;
    nbAgentsEnLigne: number;
    nbAgentsTotal: number;
  };
  clients: {
    nbTotal: number;
    nouveaux: number;
    actifs: number;
  };
  commissions: {
    duesCeMois: number;
    payees: number;
    enAttente: number;
  };
  rapports: {
    dernierRapport: string;
    alertes: string[];
  };
}

// ---------- Filtres ----------
export interface FiltresTransactions {
  dateDebut?: string;
  dateFin?: string;
  type?: TypeTransaction;
  operateur?: Operateur;
  statut?: StatutTransaction;
  agenceId?: string;
  agentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ---------- Pagination ----------
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

// ---------- Clients ----------
export interface Client {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  ville: string;
  operateur: string;
  soldeWallet: number;
  nbTransactions: number;
  montantTotal: number;
  statut: 'actif' | 'inactif' | 'bloque';
  kycStatut: 'verifie' | 'en_attente' | 'rejete';
  createdAt: string;
}

// ---------- Caisse ----------
export interface EcritureCaisse {
  id: string;
  type: 'entree' | 'sortie';
  libelle: string;
  montant: number;
  soldeApres: number;
  categorie: string;
  agentNom: string;
  date: string;
  reference: string;
}

// ---------- Recommandation IA ----------
export interface RecommandationIA {
  id: string;
  type: 'float' | 'performance' | 'fraude' | 'commission';
  titre: string;
  message: string;
  severite: 'info' | 'warning' | 'danger';
  actions: Array<{ label: string; action: string }>;
  date: string;
}
