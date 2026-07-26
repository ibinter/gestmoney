import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface KycDossier {
  id: string;
  clientId: string;
  tenantId: string;
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'VALIDE' | 'REFUSE' | 'EXPIRE';
  typeDocument?: string | null;
  numeroDocument?: string | null;
  dateExpiration?: string | null;
  paysEmetteur?: string | null;
  photoRecto?: string | null;
  photoVerso?: string | null;
  photoSelfie?: string | null;
  verifiePar?: string | null;
  verifieAt?: string | null;
  commentaire?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string | null;
  };
}

export interface KycStats {
  total: number;
  EN_ATTENTE: number;
  EN_COURS: number;
  VALIDE: number;
  REFUSE: number;
  EXPIRE: number;
}

export interface KycDossierListResult {
  data: KycDossier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Liste paginée des dossiers ─────────────────────────────────────────────

export function useKycDossiers(params?: { statut?: string; page?: number; limit?: number }) {
  return useQuery<KycDossierListResult>({
    queryKey: ['kyc-dossiers', params],
    queryFn: async () => {
      const res = await api.get('/kyc-dossiers', { params });
      return res.data;
    },
    staleTime: 30_000,
  });
}

// ── Statistiques ───────────────────────────────────────────────────────────

export function useKycStats() {
  return useQuery<KycStats>({
    queryKey: ['kyc-stats'],
    queryFn: async () => {
      const res = await api.get('/kyc-dossiers/stats');
      return res.data;
    },
    staleTime: 60_000,
  });
}

// ── Dossier d'un client ────────────────────────────────────────────────────

export function useKycDossierClient(clientId: string | null) {
  return useQuery<KycDossier | null>({
    queryKey: ['kyc-dossier-client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const res = await api.get(`/kyc-dossiers/client/${clientId}`);
      return res.data ?? null;
    },
    enabled: !!clientId,
    staleTime: 30_000,
  });
}

// ── Soumettre les documents ────────────────────────────────────────────────

export interface SoumettreDocumentsPayload {
  clientId: string;
  typeDocument: string;
  numeroDocument: string;
  dateExpiration?: string;
  paysEmetteur?: string;
  photoRecto?: string;
  photoVerso?: string;
  photoSelfie?: string;
}

export function useSoumettreDocuments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, ...dto }: SoumettreDocumentsPayload) =>
      api.post(`/kyc-dossiers/client/${clientId}`, dto),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['kyc-dossiers'] });
      qc.invalidateQueries({ queryKey: ['kyc-dossier-client', vars.clientId] });
      qc.invalidateQueries({ queryKey: ['kyc-stats'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

// ── Valider un dossier ────────────────────────────────────────────────────

export function useValiderDossier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, commentaire }: { id: string; commentaire?: string }) =>
      api.patch(`/kyc-dossiers/${id}/valider`, { commentaire }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kyc-dossiers'] });
      qc.invalidateQueries({ queryKey: ['kyc-stats'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

// ── Refuser un dossier ────────────────────────────────────────────────────

export function useRefuserDossier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, commentaire }: { id: string; commentaire: string }) =>
      api.patch(`/kyc-dossiers/${id}/refuser`, { commentaire }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kyc-dossiers'] });
      qc.invalidateQueries({ queryKey: ['kyc-stats'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
