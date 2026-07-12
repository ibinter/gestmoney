import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Client } from '@/types';

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

function mapClient(c: Record<string, unknown>): Client {
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
    statut: (c.status === 'ACTIVE' ? 'actif' : c.status === 'BLOCKED' ? 'bloque' : 'inactif') as Client['statut'],
    kycStatut: (c.kycStatus === 'VERIFIED' ? 'verifie' : c.kycStatus === 'REJECTED' ? 'rejete' : 'en_attente') as Client['kycStatut'],
    createdAt: String(c.createdAt ?? ''),
  };
}

export function useClients(params?: Record<string, string>) {
  return useQuery<Client[]>({
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
    mutationFn: (data: Partial<Client>) => api.post('/customers', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useToggleClientStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: Client['statut'] }) =>
      api.patch(`/customers/${id}`, { status: statut === 'actif' ? 'ACTIVE' : statut === 'bloque' ? 'BLOCKED' : 'INACTIVE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}
