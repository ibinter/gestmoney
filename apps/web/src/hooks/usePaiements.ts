// ============================================================
// HOOK — PAIEMENTS & ABONNEMENT (React Query + API réelle)
// Endpoints backend : /payments/methodes, /payments,
// /payments/:id, /payments/proofs, /payments/:id/proofs,
// /payments/vouchers/consommer
// ⚠️ AUCUNE donnée en dur : la liste des moyens, les numéros,
//    IBAN, adresses de wallet et instructions viennent tous du
//    champ `parametres` renvoyé par l'API. Si l'API échoue,
//    l'erreur remonte à la page qui affiche un état explicite.
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ─── Types (miroir des enums Prisma et des interfaces NestJS) ────────────────

/** enum PaymentMethod — les 10 moyens gérés par l'administration. */
export type MethodePaiement =
  | 'MOBILE_MONEY_MANUEL'
  | 'PASSERELLE'
  | 'VIREMENT_NATIONAL'
  | 'VIREMENT_INTERNATIONAL'
  | 'TRANSFERT_ARGENT'
  | 'ESPECES_AGENCE'
  | 'CHEQUE'
  | 'CRYPTO'
  | 'VOUCHER'
  | 'PAIEMENT_LIVRAISON';

/** enum PaymentProvider — canal technique attendu par POST /payments. */
export type FournisseurPaiement =
  | 'CINETPAY'
  | 'MONEROO'
  | 'FEDAPAY'
  | 'PAYSTACK'
  | 'FLUTTERWAVE'
  | 'STRIPE'
  | 'MOBILE_MONEY'
  | 'VIREMENT'
  | 'ESPECES'
  | 'MANUEL';

/** enum PaiementStatut. */
export type StatutPaiement =
  | 'EN_ATTENTE'
  | 'EN_COURS'
  | 'REUSSI'
  | 'ECHOUE'
  | 'REMBOURSE'
  | 'ANNULE'
  | 'EXPIRE';

/** enum ProofStatut. */
export type StatutPreuve = 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE';

/** Miroir de IMethodeDisponible (PaymentConfigService). Sans aucun secret. */
export interface MethodeDisponible {
  id: string;
  methode: MethodePaiement;
  variante: string;
  libelle: string;
  sandbox: boolean;
  /** Objet libre saisi en administration : instructions, numéro, IBAN, wallet… */
  parametres: Record<string, unknown>;
  devises: string[];
  ordreAffichage: number;
}

/** Miroir de IPaiement (PaymentsService). */
export interface Paiement {
  id: string;
  tenantId: string | null;
  reference: string;
  montant: number;
  devise: string;
  provider: FournisseurPaiement;
  providerRef: string | null;
  statut: StatutPaiement;
  metadata: Record<string, unknown>;
  validePar: string | null;
  valideAt: string | null;
  rembourseAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Miroir de IPreuve (PaymentsService), sans le chemin de stockage. */
export interface PreuvePaiement {
  id: string;
  paiementId: string;
  nomOriginal: string | null;
  mimeType: string | null;
  tailleOctets: number | null;
  hashSha256: string | null;
  referenceTexte: string | null;
  statut: StatutPreuve;
  motifRejet: string | null;
  revuPar: string | null;
  revuAt: string | null;
  createdAt: string;
}

/** Miroir de IResultatConsommation (VouchersService). */
export interface ResultatVoucher {
  voucherId: string;
  code: string;
  valeur: number;
  devise: string;
  plan: string | null;
  dureeJours: number;
  utiliseAt: string;
}

/** Corps de POST /payments — noms de champs alignés sur CreatePaiementDto. */
export interface CreerPaiementInput {
  montant: number;
  devise?: string;
  provider: FournisseurPaiement;
  configId?: string;
  plan?: string;
  metadata?: Record<string, unknown>;
}

/** Corps de POST /payments/proofs — multipart, cf. UploadProofDto. */
export interface TeleverserPreuveInput {
  paiementId: string;
  /** Image (jpg, png, gif, webp, heic) ou PDF, 10 Mo maximum côté API. */
  fichier: File;
  /** MTCN, numéro de chèque, hash de transaction, code de reçu… */
  referenceTexte?: string;
}

/** Filtres acceptés par GET /payments/methodes. */
export interface FiltresMethodes {
  pays?: string;
  plan?: string;
  devise?: string;
}

// ─── Correspondance méthode → fournisseur ────────────────────────────────────

/**
 * `POST /payments` attend un `provider` (enum PaymentProvider), alors que
 * l'administration configure une `methode` (enum PaymentMethod). Cette table
 * fait la correspondance pour les moyens dont le canal technique est
 * déterminé. PASSERELLE est volontairement absente : le fournisseur réel
 * (CINETPAY, STRIPE…) dépend de la configuration et est résolu par
 * `resoudreFournisseur` à partir de `parametres.provider` ou de la variante.
 * VOUCHER est absente également : un code prépayé ne crée pas de paiement.
 */
const FOURNISSEUR_PAR_METHODE: Partial<Record<MethodePaiement, FournisseurPaiement>> = {
  MOBILE_MONEY_MANUEL: 'MOBILE_MONEY',
  VIREMENT_NATIONAL: 'VIREMENT',
  VIREMENT_INTERNATIONAL: 'VIREMENT',
  TRANSFERT_ARGENT: 'MANUEL',
  ESPECES_AGENCE: 'ESPECES',
  CHEQUE: 'MANUEL',
  CRYPTO: 'MANUEL',
  PAIEMENT_LIVRAISON: 'ESPECES',
};

/** Fournisseurs de passerelle reconnus par l'enum PaymentProvider. */
const FOURNISSEURS_PASSERELLE: FournisseurPaiement[] = [
  'CINETPAY',
  'MONEROO',
  'FEDAPAY',
  'PAYSTACK',
  'FLUTTERWAVE',
  'STRIPE',
];

/**
 * Fournisseur à envoyer à l'API pour une méthode donnée.
 *
 * Renvoie `null` quand il ne peut pas être déterminé — cas d'une PASSERELLE
 * dont la configuration n'indique pas de fournisseur reconnu. On préfère
 * bloquer et le dire à l'utilisateur plutôt que d'inventer une valeur.
 */
export function resoudreFournisseur(methode: MethodeDisponible): FournisseurPaiement | null {
  if (methode.methode === 'PASSERELLE') {
    const candidat = String(
      (methode.parametres?.provider as string | undefined) ?? methode.variante ?? '',
    )
      .trim()
      .toUpperCase();
    const trouve = FOURNISSEURS_PASSERELLE.find((f) => f === candidat);
    return trouve ?? null;
  }
  return FOURNISSEUR_PAR_METHODE[methode.methode] ?? null;
}

// ─── Clés de cache ───────────────────────────────────────────────────────────

const CLE_METHODES = ['payments', 'methodes'] as const;
const CLE_PAIEMENTS = ['payments', 'liste'] as const;

// ─── Lectures ────────────────────────────────────────────────────────────────

/** Moyens de paiement ACTIFS et compatibles. Un moyen désactivé disparaît. */
export function useMethodesPaiement(filtres: FiltresMethodes = {}) {
  return useQuery<MethodeDisponible[]>({
    queryKey: [...CLE_METHODES, filtres],
    queryFn: async () => {
      const { data } = await api.get<MethodeDisponible[]>('/payments/methodes', {
        params: filtres,
      });
      return data;
    },
  });
}

/** Historique des paiements de l'utilisateur courant. */
export function useMesPaiements() {
  return useQuery<Paiement[]>({
    queryKey: CLE_PAIEMENTS,
    queryFn: async () => {
      const { data } = await api.get<Paiement[]>('/payments');
      return data;
    },
  });
}

/** Preuves déjà soumises pour un paiement. Inactif tant qu'aucun id n'est fourni. */
export function usePreuvesPaiement(paiementId?: string) {
  return useQuery<PreuvePaiement[]>({
    queryKey: ['payments', 'preuves', paiementId],
    enabled: Boolean(paiementId),
    queryFn: async () => {
      const { data } = await api.get<PreuvePaiement[]>(`/payments/${paiementId}/proofs`);
      return data;
    },
  });
}

// ─── Écritures ───────────────────────────────────────────────────────────────

/** Crée un paiement. Il reste EN_ATTENTE : rien n'est activé à ce stade. */
export function useCreerPaiement() {
  const queryClient = useQueryClient();
  return useMutation<Paiement, unknown, CreerPaiementInput>({
    mutationFn: async (input) => {
      const { data } = await api.post<Paiement>('/payments', input);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLE_PAIEMENTS });
    },
  });
}

/**
 * Téléverse une preuve (image ou PDF) et/ou une référence textuelle.
 * Le paiement passe au plus en EN_COURS : seule la validation d'un
 * administrateur (ou un webhook signé) peut le faire passer à REUSSI.
 */
export function useTeleverserPreuve() {
  const queryClient = useQueryClient();
  return useMutation<PreuvePaiement, unknown, TeleverserPreuveInput>({
    mutationFn: async ({ paiementId, fichier, referenceTexte }) => {
      const formulaire = new FormData();
      formulaire.append('paiementId', paiementId);
      formulaire.append('file', fichier);
      if (referenceTexte) formulaire.append('referenceTexte', referenceTexte);
      const { data } = await api.post<PreuvePaiement>('/payments/proofs', formulaire, {
        // On laisse le navigateur poser lui-même la frontière multipart.
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (preuve) => {
      void queryClient.invalidateQueries({ queryKey: CLE_PAIEMENTS });
      void queryClient.invalidateQueries({ queryKey: ['payments', 'preuves', preuve.paiementId] });
    },
  });
}

/** Consomme un code prépayé. Succès = activation immédiate côté serveur. */
export function useConsommerVoucher() {
  const queryClient = useQueryClient();
  return useMutation<ResultatVoucher, unknown, string>({
    mutationFn: async (code) => {
      const { data } = await api.post<ResultatVoucher>('/payments/vouchers/consommer', {
        code: code.trim(),
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLE_PAIEMENTS });
    },
  });
}

// ─── Utilitaire d'erreur ─────────────────────────────────────────────────────

/** Message d'erreur lisible extrait d'une réponse Axios, sans jamais inventer. */
export function messageErreurApi(erreur: unknown, repli: string): string {
  const message = (
    erreur as { response?: { data?: { message?: string | string[] } } }
  )?.response?.data?.message;
  if (Array.isArray(message)) return message.join(' · ');
  return message ? String(message) : repli;
}
