// ============================================================
// HOOK useDashboardStats — GESTMONEY
// Récupère les statistiques du dashboard selon le rôle utilisateur
// Fallback sur données mockées si le backend est indisponible
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface Transaction {
  id: string;
  type: string;
  montant: number;
  operateur: string;
  statut: 'success' | 'pending' | 'failed';
  clientNom: string;
  agentNom: string;
  agenceNom: string;
  date: string;
}

export interface AgentPerf {
  id: string;
  nom: string;
  nbTransactions: number;
  volume: number;
  commission: number;
  statut: 'actif' | 'inactif';
}

export interface AuditEntry {
  id: string;
  action: string;
  utilisateur: string;
  ressource: string;
  date: string;
  ip: string;
}

export interface DashboardStatsExtended {
  // Communs
  nbTransactionsJour: number;
  volumeJour: number;
  variationPct: number;
  // Admin/SuperAdmin
  nbAgentsActifs: number;
  nbAgencesActives: number;
  alertesAgentsInactifs: number;
  alertesFloatBas: number;
  commissionsAValider: number;
  transactionsRecentes: Transaction[];
  sparklineData: number[]; // 7 jours
  // Manager
  nbAgentsSupervisés: number;
  volumeAgence: number;
  alerteFloatAgence: boolean;
  performancesAgents: AgentPerf[];
  // Agent/Caissier
  maCommissionMois: number;
  monFloat: number;
  mesTransactions: Transaction[];
  // Auditeur
  operationsAuditees: number;
  journalAudit: AuditEntry[];
}

// ─── Données mockées proprement signalées ───────────────────────────────────
// [MOCK] Ces données sont utilisées quand le backend NestJS est inaccessible.
// Elles doivent être remplacées par de vraies données API en production.

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'depot', montant: 50000, operateur: 'orange_money', statut: 'success', clientNom: 'Konan Yao', agentNom: 'Diallo Moussa', agenceNom: 'Agence Plateau', date: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 't2', type: 'retrait', montant: 25000, operateur: 'wave', statut: 'success', clientNom: 'Ama Kofi', agentNom: 'Touré Fatima', agenceNom: 'Agence Yopougon', date: new Date(Date.now() - 18 * 60000).toISOString() },
  { id: 't3', type: 'transfert', montant: 100000, operateur: 'mtn_momo', statut: 'pending', clientNom: 'Ibrahim Sow', agentNom: 'Diallo Moussa', agenceNom: 'Agence Plateau', date: new Date(Date.now() - 35 * 60000).toISOString() },
  { id: 't4', type: 'depot', montant: 75000, operateur: 'moov', statut: 'success', clientNom: 'Aissatou Bah', agentNom: 'Camara Jean', agenceNom: 'Agence Cocody', date: new Date(Date.now() - 52 * 60000).toISOString() },
  { id: 't5', type: 'retrait', montant: 30000, operateur: 'orange_money', statut: 'failed', clientNom: 'Mamadou Keita', agentNom: 'Touré Fatima', agenceNom: 'Agence Yopougon', date: new Date(Date.now() - 78 * 60000).toISOString() },
  { id: 't6', type: 'paiement', montant: 15000, operateur: 'wave', statut: 'success', clientNom: 'Nadia Coulibaly', agentNom: 'Camara Jean', agenceNom: 'Agence Cocody', date: new Date(Date.now() - 95 * 60000).toISOString() },
  { id: 't7', type: 'depot', montant: 200000, operateur: 'mtn_momo', statut: 'success', clientNom: 'Seydou Traoré', agentNom: 'Koné Ali', agenceNom: 'Agence Marcory', date: new Date(Date.now() - 110 * 60000).toISOString() },
  { id: 't8', type: 'retrait', montant: 45000, operateur: 'orange_money', statut: 'success', clientNom: 'Bintou Diarra', agentNom: 'Koné Ali', agenceNom: 'Agence Marcory', date: new Date(Date.now() - 130 * 60000).toISOString() },
  { id: 't9', type: 'transfert', montant: 85000, operateur: 'airtel', statut: 'success', clientNom: 'Oumar Bamba', agentNom: 'Diallo Moussa', agenceNom: 'Agence Plateau', date: new Date(Date.now() - 155 * 60000).toISOString() },
  { id: 't10', type: 'depot', montant: 60000, operateur: 'wave', statut: 'success', clientNom: 'Mariam Sanogo', agentNom: 'Touré Fatima', agenceNom: 'Agence Yopougon', date: new Date(Date.now() - 180 * 60000).toISOString() },
];

const MOCK_AGENTS_PERF: AgentPerf[] = [
  { id: 'a1', nom: 'Diallo Moussa', nbTransactions: 48, volume: 2450000, commission: 73500, statut: 'actif' },
  { id: 'a2', nom: 'Touré Fatima', nbTransactions: 35, volume: 1820000, commission: 54600, statut: 'actif' },
  { id: 'a3', nom: 'Camara Jean', nbTransactions: 29, volume: 1345000, commission: 40350, statut: 'actif' },
  { id: 'a4', nom: 'Koné Ali', nbTransactions: 22, volume: 980000, commission: 29400, statut: 'inactif' },
  { id: 'a5', nom: 'Bamba Sékou', nbTransactions: 0, volume: 0, commission: 0, statut: 'inactif' },
];

const MOCK_AUDIT: AuditEntry[] = [
  { id: 'au1', action: 'LOGIN', utilisateur: 'admin@gestmoney.ci', ressource: 'AUTH', date: new Date(Date.now() - 10 * 60000).toISOString(), ip: '197.255.14.12' },
  { id: 'au2', action: 'TRANSACTION_CREATE', utilisateur: 'diallo.moussa@gestmoney.ci', ressource: 'TRANSACTION#t1', date: new Date(Date.now() - 25 * 60000).toISOString(), ip: '197.255.14.13' },
  { id: 'au3', action: 'FLOAT_UPDATE', utilisateur: 'manager@gestmoney.ci', ressource: 'FLOAT#orange_money', date: new Date(Date.now() - 42 * 60000).toISOString(), ip: '41.203.18.55' },
  { id: 'au4', action: 'USER_UPDATE', utilisateur: 'admin@gestmoney.ci', ressource: 'USER#a4', date: new Date(Date.now() - 68 * 60000).toISOString(), ip: '197.255.14.12' },
  { id: 'au5', action: 'COMMISSION_VALIDATE', utilisateur: 'admin@gestmoney.ci', ressource: 'COMMISSION#c12', date: new Date(Date.now() - 95 * 60000).toISOString(), ip: '197.255.14.12' },
];

const MOCK_STATS: DashboardStatsExtended = {
  nbTransactionsJour: 247,
  volumeJour: 12450000,
  variationPct: 12.5,
  nbAgentsActifs: 34,
  nbAgencesActives: 8,
  alertesAgentsInactifs: 3,
  alertesFloatBas: 1,
  commissionsAValider: 5,
  transactionsRecentes: MOCK_TRANSACTIONS,
  sparklineData: [180, 210, 195, 240, 228, 255, 247],
  nbAgentsSupervisés: 8,
  volumeAgence: 3250000,
  alerteFloatAgence: false,
  performancesAgents: MOCK_AGENTS_PERF,
  maCommissionMois: 48500,
  monFloat: 850000,
  mesTransactions: MOCK_TRANSACTIONS.slice(0, 5),
  operationsAuditees: 1842,
  journalAudit: MOCK_AUDIT,
};

// ─── Hook principal ──────────────────────────────────────────────────────────

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStatsExtended | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/dashboard/extended-stats');
      const raw = res.data?.data ?? res.data ?? {};
      // Mapper les données API vers notre interface
      setStats({ ...MOCK_STATS, ...raw });
      setIsMock(false);
    } catch {
      // [MOCK] Backend inaccessible — utilisation des données de démonstration
      setStats(MOCK_STATS);
      setIsMock(true);
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date().toISOString());
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, isMock, lastUpdated, refresh: fetchStats };
}
