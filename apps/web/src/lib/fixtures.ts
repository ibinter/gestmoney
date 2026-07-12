// ============================================================
// DONNÉES MOCKÉES — GESTMONEY
// Utilisées en développement avant connexion API réelle
// ============================================================
import {
  Transaction,
  FloatSolde,
  Agent,
  Commission,
  DashboardStats,
  RecommandationIA,
  DemandeReapprovisionnement,
} from '@/types';

// ---------- Dashboard Stats ----------
export const mockDashboardStats: DashboardStats = {
  transactions: {
    nbAujourdhui: 247,
    montantAujourdhui: 48_750_000,
    variationPct: 12.5,
    enAttente: 8,
  },
  caisse: {
    soldeActuel: 12_350_000,
    entrees: 32_100_000,
    sorties: 19_750_000,
    ecart: 0,
  },
  float: {
    soldes: [
      { id: '1', operateur: 'orange_money', soldeActuel: 5_200_000, seuilAlerte: 2_000_000, seuilCritique: 500_000, statut: 'ok', derniereMaj: '2024-01-15T08:30:00', evolution: [4800000, 5100000, 4900000, 5300000, 5000000, 5150000, 5200000] },
      { id: '2', operateur: 'mtn_momo',     soldeActuel: 1_800_000, seuilAlerte: 2_000_000, seuilCritique: 500_000, statut: 'alerte', derniereMaj: '2024-01-15T08:30:00', evolution: [3200000, 2900000, 2600000, 2300000, 2100000, 1950000, 1800000] },
      { id: '3', operateur: 'wave',          soldeActuel: 3_400_000, seuilAlerte: 1_500_000, seuilCritique: 400_000, statut: 'ok', derniereMaj: '2024-01-15T08:30:00', evolution: [3100000, 3200000, 3350000, 3400000, 3380000, 3410000, 3400000] },
      { id: '4', operateur: 'moov',          soldeActuel: 420_000,  seuilAlerte: 1_000_000, seuilCritique: 300_000, statut: 'critique', derniereMaj: '2024-01-15T08:30:00', evolution: [1500000, 1200000, 900000, 700000, 600000, 500000, 420000] },
      { id: '5', operateur: 'airtel',        soldeActuel: 2_100_000, seuilAlerte: 1_000_000, seuilCritique: 300_000, statut: 'ok', derniereMaj: '2024-01-15T08:30:00', evolution: [1900000, 2000000, 2050000, 2100000, 2080000, 2090000, 2100000] },
    ],
    alertes: 2,
  },
  performances: {
    chiffreAffaires: 145_200_000,
    objectif: 200_000_000,
    progressionPct: 72.6,
    topAgent: { nom: 'Amadou Traoré', montant: 8_500_000 },
  },
  agences: {
    nbActives: 12,
    nbTotal: 15,
    nbAgentsEnLigne: 34,
    nbAgentsTotal: 48,
  },
  clients: {
    nbTotal: 8_420,
    nouveaux: 127,
    actifs: 3_210,
  },
  commissions: {
    duesCeMois: 2_340_000,
    payees: 1_850_000,
    enAttente: 490_000,
  },
  rapports: {
    dernierRapport: '2024-01-14T18:00:00',
    alertes: ['Float MTN MoMo sous le seuil', 'Float Moov en zone critique'],
  },
};

// ---------- Transactions ----------
export const mockTransactions: Transaction[] = [
  { id: '1', reference: 'TXN-2024-001247', type: 'depot', operateur: 'orange_money', agentId: 'a1', agentNom: 'Kofi Mensah', agenceId: 'ag1', agenceNom: 'Agence Plateau', clientNom: 'Yao Kouassi', clientTel: '0701234567', montant: 150_000, frais: 1_500, commission: 750, statut: 'success', date: '2024-01-15T14:32:00' },
  { id: '2', reference: 'TXN-2024-001246', type: 'retrait', operateur: 'mtn_momo', agentId: 'a2', agentNom: 'Ama Diallo', agenceId: 'ag1', agenceNom: 'Agence Plateau', clientNom: 'Fatoumata Bah', clientTel: '0707654321', montant: 75_000, frais: 750, commission: 375, statut: 'success', date: '2024-01-15T14:28:00' },
  { id: '3', reference: 'TXN-2024-001245', type: 'cash_in', operateur: 'wave', agentId: 'a1', agentNom: 'Kofi Mensah', agenceId: 'ag1', agenceNom: 'Agence Plateau', clientNom: 'Ibrahim Cissé', clientTel: '0701112233', montant: 200_000, frais: 0, commission: 1_000, statut: 'pending', date: '2024-01-15T14:15:00' },
  { id: '4', reference: 'TXN-2024-001244', type: 'cash_out', operateur: 'orange_money', agentId: 'a3', agentNom: 'Sekou Touré', agenceId: 'ag2', agenceNom: 'Agence Cocody', clientNom: 'Marie Konan', clientTel: '0708887766', montant: 50_000, frais: 500, commission: 250, statut: 'success', date: '2024-01-15T13:55:00' },
  { id: '5', reference: 'TXN-2024-001243', type: 'transfert', operateur: 'moov', agentId: 'a4', agentNom: 'Abou Kone', agenceId: 'ag2', agenceNom: 'Agence Cocody', clientNom: 'Jean Aka', clientTel: '0705551234', montant: 30_000, frais: 300, commission: 150, statut: 'failed', date: '2024-01-15T13:40:00' },
  { id: '6', reference: 'TXN-2024-001242', type: 'depot', operateur: 'airtel', agentId: 'a5', agentNom: 'Adja Sow', agenceId: 'ag3', agenceNom: 'Agence Yopougon', clientNom: 'Bintou Camara', clientTel: '0702223344', montant: 100_000, frais: 1_000, commission: 500, statut: 'success', date: '2024-01-15T13:22:00' },
  { id: '7', reference: 'TXN-2024-001241', type: 'retrait', operateur: 'wave', agentId: 'a2', agentNom: 'Ama Diallo', agenceId: 'ag1', agenceNom: 'Agence Plateau', clientNom: 'Oumar Sylla', clientTel: '0709998877', montant: 250_000, frais: 2_500, commission: 1_250, statut: 'success', date: '2024-01-15T13:10:00' },
  { id: '8', reference: 'TXN-2024-001240', type: 'paiement', operateur: 'mtn_momo', agentId: 'a6', agentNom: 'Mariam Keita', agenceId: 'ag3', agenceNom: 'Agence Yopougon', montant: 45_000, frais: 450, commission: 225, statut: 'success', date: '2024-01-15T12:58:00' },
];

// ---------- Float mouvements ----------
export const mockMouvementsFloat = [
  { id: '1', type: 'entree' as const, operateur: 'orange_money' as const, montant: 500_000, description: 'Réapprovisionnement', soldeAvant: 4_700_000, soldeApres: 5_200_000, date: '2024-01-15T07:00:00', agentId: 'admin' },
  { id: '2', type: 'sortie' as const, operateur: 'orange_money' as const, montant: 150_000, description: 'Dépôt client TXN-001247', soldeAvant: 5_350_000, soldeApres: 5_200_000, date: '2024-01-15T14:32:00', agentId: 'a1' },
  { id: '3', type: 'sortie' as const, operateur: 'mtn_momo' as const, montant: 75_000, description: 'Retrait client TXN-001246', soldeAvant: 1_875_000, soldeApres: 1_800_000, date: '2024-01-15T14:28:00', agentId: 'a2' },
];

// ---------- Demandes réapprovisionnement ----------
export const mockDemandesReappro: DemandeReapprovisionnement[] = [
  { id: '1', operateur: 'mtn_momo', montant: 3_000_000, statut: 'en_attente', demandeurId: 'a1', demandeurNom: 'Kofi Mensah', date: '2024-01-15T09:00:00', commentaire: 'Seuil d\'alerte atteint' },
  { id: '2', operateur: 'moov', montant: 2_000_000, statut: 'approuve', demandeurId: 'admin', demandeurNom: 'Admin', date: '2024-01-15T08:00:00', commentaire: 'Zone critique' },
];

// ---------- Agents ----------
export const mockAgents: Agent[] = [
  { id: 'a1', nom: 'Mensah', prenom: 'Kofi', email: 'kofi.mensah@gestmoney.ci', telephone: '0701234567', agenceId: 'ag1', agenceNom: 'Agence Plateau', actif: true, enLigne: true, nbTransactionsAujourdhui: 42, montantTransactionsAujourdhui: 8_500_000, commission: 42_500, createdAt: '2023-06-01' },
  { id: 'a2', nom: 'Diallo', prenom: 'Ama', email: 'ama.diallo@gestmoney.ci', telephone: '0707654321', agenceId: 'ag1', agenceNom: 'Agence Plateau', actif: true, enLigne: true, nbTransactionsAujourdhui: 35, montantTransactionsAujourdhui: 6_200_000, commission: 31_000, createdAt: '2023-07-15' },
  { id: 'a3', nom: 'Touré', prenom: 'Sekou', email: 'sekou.toure@gestmoney.ci', telephone: '0708887766', agenceId: 'ag2', agenceNom: 'Agence Cocody', actif: true, enLigne: false, nbTransactionsAujourdhui: 28, montantTransactionsAujourdhui: 4_800_000, commission: 24_000, createdAt: '2023-08-01' },
  { id: 'a4', nom: 'Koné', prenom: 'Abou', email: 'abou.kone@gestmoney.ci', telephone: '0705551234', agenceId: 'ag2', agenceNom: 'Agence Cocody', actif: true, enLigne: true, nbTransactionsAujourdhui: 19, montantTransactionsAujourdhui: 3_100_000, commission: 15_500, createdAt: '2023-09-10' },
  { id: 'a5', nom: 'Sow', prenom: 'Adja', email: 'adja.sow@gestmoney.ci', telephone: '0702223344', agenceId: 'ag3', agenceNom: 'Agence Yopougon', actif: true, enLigne: true, nbTransactionsAujourdhui: 31, montantTransactionsAujourdhui: 5_400_000, commission: 27_000, createdAt: '2023-05-20' },
  { id: 'a6', nom: 'Keita', prenom: 'Mariam', email: 'mariam.keita@gestmoney.ci', telephone: '0709998877', agenceId: 'ag3', agenceNom: 'Agence Yopougon', actif: false, enLigne: false, nbTransactionsAujourdhui: 0, montantTransactionsAujourdhui: 0, commission: 0, createdAt: '2023-10-05' },
];

// ---------- Commissions ----------
export const mockCommissions: Commission[] = [
  { id: 'c1', agentId: 'a1', agentNom: 'Kofi Mensah', agenceId: 'ag1', agenceNom: 'Agence Plateau', periode: '2024-01', nbTransactions: 420, montantTransactions: 85_000_000, tauxCommission: 0.5, montantCommission: 425_000, statut: 'calculee' },
  { id: 'c2', agentId: 'a2', agentNom: 'Ama Diallo', agenceId: 'ag1', agenceNom: 'Agence Plateau', periode: '2024-01', nbTransactions: 350, montantTransactions: 62_000_000, tauxCommission: 0.5, montantCommission: 310_000, statut: 'validee' },
  { id: 'c3', agentId: 'a3', agentNom: 'Sekou Touré', agenceId: 'ag2', agenceNom: 'Agence Cocody', periode: '2024-01', nbTransactions: 280, montantTransactions: 48_000_000, tauxCommission: 0.5, montantCommission: 240_000, statut: 'payee', datePaiement: '2024-01-10' },
  { id: 'c4', agentId: 'a4', agentNom: 'Abou Koné', agenceId: 'ag2', agenceNom: 'Agence Cocody', periode: '2024-01', nbTransactions: 190, montantTransactions: 31_000_000, tauxCommission: 0.5, montantCommission: 155_000, statut: 'calculee' },
  { id: 'c5', agentId: 'a5', agentNom: 'Adja Sow', agenceId: 'ag3', agenceNom: 'Agence Yopougon', periode: '2024-01', nbTransactions: 310, montantTransactions: 54_000_000, tauxCommission: 0.5, montantCommission: 270_000, statut: 'validee' },
];

// ---------- Recommandation IA ----------
export const mockRecommandationIA: RecommandationIA = {
  id: 'ia1',
  type: 'float',
  titre: 'Alerte Float MTN MoMo & Moov',
  message: 'Le float MTN MoMo est sous le seuil d\'alerte (1,8M FCFA / seuil: 2M). Le float Moov est en zone critique (420K FCFA). Je recommande un réapprovisionnement immédiat de 3M FCFA pour MTN MoMo et 2M FCFA pour Moov.',
  severite: 'warning',
  actions: [
    { label: 'Réapprovisionner', action: 'reappro_float' },
    { label: 'Voir détails', action: 'voir_float' },
  ],
  date: '2024-01-15T14:00:00',
};
