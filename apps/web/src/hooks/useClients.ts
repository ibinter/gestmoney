import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Client } from '@/types';

// `Client` vit dans `@/types` (non modifiable ici) : on l'étend localement pour
// porter les champs KYC additionnels renvoyés par l'API. Les composants qui ont
// besoin du dossier KYC importent `ClientKyc` depuis ce hook.
export interface ClientKyc extends Client {
  /** Statut brut renvoyé par l'API (VERIFIED / PENDING / REJECTED…). */
  kycStatus?: string | null;
  /** Motif fourni lors d'un rejet KYC. */
  kycMotifRejet?: string | null;
  /** Type de pièce déposée (CNI, passeport…). */
  kycDocumentType?: string | null;
  /** Vrai si une pièce d'identité est déjà enregistrée. */
  kycADocument?: boolean;
}

const mockClients: Client[] = [
  { id: 'c1', nom: 'Kouassi', prenom: 'Yao', telephone: '0701234567', email: 'yao.k@email.ci', ville: 'Abidjan', operateur: 'Orange Money', soldeWallet: 125_000, nbTransactions: 48, montantTotal: 2_400_000, statut: 'actif', kycStatut: 'verifie', createdAt: '2023-03-10' },
  { id: 'c2', nom: 'Bah', prenom: 'Fatoumata', telephone: '0707654321', ville: 'Abidjan', operateur: 'MTN MoMo', soldeWallet: 45_000, nbTransactions: 23, montantTotal: 980_000, statut: 'actif', kycStatut: 'verifie', createdAt: '2023-05-22' },
  { id: 'c3', nom: 'Cisse', prenom: 'Ibrahim', telephone: '0701112233', ville: 'Bouake', operateur: 'Wave', soldeWallet: 8_000, nbTransactions: 7, montantTotal: 150_000, statut: 'actif', kycStatut: 'en_attente', createdAt: '2024-01-05' },
  { id: 'c4', nom: 'Konan', prenom: 'Marie', telephone: '0708887766', ville: 'Abidjan', operateur: 'Orange Money', soldeWallet: 230_000, nbTransactions: 72, montantTotal: 5_600_000, statut: 'actif', kycStatut: 'verifie', createdAt: '2022-11-30' },
  { id: 'c5', nom: 'Aka', prenom: 'Jean', telephone: '0705551234', ville: 'Yamoussoukro', operateur: 'Moov', soldeWallet: 0, nbTransactions: 3, montantTotal: 45_000, statut: 'bloque', kycStatut: 'rejete', createdAt: '2023-09-14' },
  { id: 'c6', nom: 'Camara', prenom: 'Bintou', telephone: '0702223344', ville: 'Abidjan', operateur: 'Airtel', soldeWallet: 67_000, nbTransactions: 19, montantTotal: 780_000, statut: 'actif', kycStatut: 'verifie', createdAt: '2023-08-01' },
  { id: 'c7', nom: 'Sylla', prenom: 'Oumar', telephone: '0709998877', ville: 'San Pedro', operateur: 'Wave', soldeWallet: 320_000, nbTransactions: 55, montantTotal: 3_200_000, statut: 'actif', kycStatut: 'verifie', createdAt: '2023-04-15' },
  { id: 'c8', nom: 'Toure', prenom: 'Aminata', telephone: '0703334455', ville: 'Abidjan', operateur: 'MTN MoMo', soldeWallet: 0, nbTransactions: 0, montantTotal: 0, statut: 'inactif', kycStatut: 'en_attente', createdAt: '2024-01-10' },
];

// L'API renvoie déjà les champs FR calculés (statut, kycStatut, prenom…) ET
// des champs EN bruts (status renvoyé en minuscules « active », kycStatus
// absent). On privilégie donc les champs FR fournis par l'API et on ne
// retombe sur le mapping EN (normalisé en majuscules) que s'ils manquent —
// sinon tout client s'affichait « inactif » / « en_attente ».
function mapStatut(c: Record<string, unknown>): Client['statut'] {
  if (c.statut === 'actif' || c.statut === 'bloque' || c.statut === 'inactif') {
    return c.statut as Client['statut'];
  }
  const s = String(c.status ?? '').toUpperCase();
  return s === 'ACTIVE' ? 'actif' : s === 'BLACKLISTED' || s === 'BLOCKED' ? 'bloque' : 'inactif';
}

function mapKyc(c: Record<string, unknown>): Client['kycStatut'] {
  if (c.kycStatut === 'verifie' || c.kycStatut === 'rejete' || c.kycStatut === 'en_attente') {
    return c.kycStatut as Client['kycStatut'];
  }
  const k = String(c.kycStatus ?? '').toUpperCase();
  return k === 'VERIFIED' ? 'verifie' : k === 'REJECTED' ? 'rejete' : 'en_attente';
}

function mapClient(c: Record<string, unknown>): ClientKyc {
  return {
    id: String(c.id ?? ''),
    nom: String(c.lastName ?? c.nom ?? ''),
    prenom: String(c.firstName ?? c.prenom ?? ''),
    telephone: String(c.phone ?? c.telephone ?? ''),
    email: c.email ? String(c.email) : undefined,
    ville: String(c.city ?? c.ville ?? ''),
    operateur: String(c.operator ?? c.operateur ?? ''),
    soldeWallet: Number(c.walletBalance ?? c.soldeWallet ?? 0),
    nbTransactions: Number(c.transactionsCount ?? c.nbTransactions ?? 0),
    montantTotal: Number(c.totalAmount ?? c.montantTotal ?? 0),
    statut: mapStatut(c),
    kycStatut: mapKyc(c),
    kycStatus: c.kycStatus != null ? String(c.kycStatus) : null,
    kycMotifRejet: c.kycMotifRejet != null ? String(c.kycMotifRejet) : null,
    kycDocumentType: c.kycDocumentType != null ? String(c.kycDocumentType) : null,
    kycADocument: Boolean(c.kycADocument),
    createdAt: String(c.createdAt ?? ''),
  };
}

export function useClients(params?: Record<string, string>) {
  return useQuery<ClientKyc[]>({
    queryKey: ['clients', params],
    queryFn: async () => {
      try {
        const res = await api.get('/customers', { params });
        const raw: unknown[] = res.data?.data ?? res.data ?? [];
        return raw.map((c) => mapClient(c as Record<string, unknown>));
      } catch {
        return mockClients;
      }
    },
    staleTime: 30_000,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    // L'API attend le DTO EN (firstName/lastName/phone/address) en
    // forbidNonWhitelisted : on mappe les champs FR du formulaire et on
    // n'envoie QUE les champs autorisés (jamais prenom/nom/telephone/ville).
    mutationFn: (data: Partial<Client>) =>
      api.post('/customers', {
        firstName: data.prenom,
        lastName: data.nom,
        phone: data.telephone,
        ...(data.email ? { email: data.email } : {}),
        ...(data.ville ? { address: data.ville } : {}),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useToggleClientStatus() {
  const qc = useQueryClient();
  return useMutation({
    // L'enum Prisma CustomerStatus est ACTIVE / INACTIVE / BLACKLISTED
    // (pas « BLOCKED » — cette valeur était silencieusement ignorée).
    mutationFn: ({ id, statut }: { id: string; statut: Client['statut'] }) =>
      api.patch(`/customers/${id}`, { status: statut === 'actif' ? 'ACTIVE' : statut === 'bloque' ? 'BLACKLISTED' : 'INACTIVE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

// ============================================================
// FLUX KYC — dépôt du dossier, approbation / rejet (ADMIN)
// N'envoie QUE les champs du contrat (forbidNonWhitelisted côté API).
// ============================================================

/** Dépose (ou redépose) le dossier KYC → passe le client « en attente ». */
export function useSoumettreKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, documentUrl, documentType, nationalId }: {
      id: string;
      documentUrl: string;
      documentType?: string;
      nationalId?: string;
    }) =>
      api.patch(`/customers/${id}/kyc/submit`, {
        documentUrl,
        ...(documentType ? { documentType } : {}),
        ...(nationalId ? { nationalId } : {}),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

/** Approuve le KYC (ADMIN uniquement) → passe le client « vérifié ». */
export function useApprouverKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      api.patch(`/customers/${id}/kyc/approve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

/** Rejette le KYC (ADMIN uniquement) → passe le client « rejeté » + motif. */
export function useRejeterKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.patch(`/customers/${id}/kyc/reject`, {
        ...(reason ? { reason } : {}),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

/** Récupère la pièce d'identité déposée (data URL + type) pour l'afficher. */
export function useVoirDocumentKyc() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.get(`/customers/${id}/kyc/document`);
      return res.data as { documentUrl: string; documentType?: string | null };
    },
  });
}
