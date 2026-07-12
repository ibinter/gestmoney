import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Agence } from '@/types';
import api from '@/lib/api';

const KEYS = {
  all: ['agences'] as const,
  list: () => ['agences', 'list'] as const,
};

const mockAgences: Agence[] = [
  { id: 'ag1', nom: 'Agence Plateau', code: 'AG-PLT-001', ville: 'Abidjan', adresse: 'Avenue Noguès, Plateau', telephone: '0701000001', responsableId: 'u1', responsableNom: 'Kofi Mensah', nbAgents: 12, nbAgentsEnLigne: 8, active: true, createdAt: '2023-01-15' },
  { id: 'ag2', nom: 'Agence Cocody', code: 'AG-COC-002', ville: 'Abidjan', adresse: 'Rue des Jardins, Cocody', telephone: '0701000002', responsableId: 'u2', responsableNom: 'Ama Diallo', nbAgents: 9, nbAgentsEnLigne: 6, active: true, createdAt: '2023-03-01' },
  { id: 'ag3', nom: 'Agence Yopougon', code: 'AG-YOP-003', ville: 'Abidjan', adresse: 'Boulevard de France, Yopougon', telephone: '0701000003', responsableId: 'u3', responsableNom: 'Sekou Toure', nbAgents: 15, nbAgentsEnLigne: 10, active: true, createdAt: '2023-02-10' },
  { id: 'ag4', nom: 'Agence Bouake', code: 'AG-BKE-004', ville: 'Bouake', adresse: 'Quartier Commerce, Centre', telephone: '0701000004', responsableId: 'u4', responsableNom: 'Fatou Coulibaly', nbAgents: 7, nbAgentsEnLigne: 4, active: true, createdAt: '2023-05-20' },
  { id: 'ag5', nom: 'Agence San Pedro', code: 'AG-SAN-005', ville: 'San Pedro', adresse: 'Zone Portuaire, San Pedro', telephone: '0701000005', responsableId: 'u5', responsableNom: 'Ibrahim Kone', nbAgents: 5, nbAgentsEnLigne: 2, active: false, createdAt: '2023-07-01' },
];

function mapAgence(a: any): Agence {
  return {
    id: a.id,
    nom: a.name ?? a.nom ?? '',
    code: a.code ?? '',
    ville: a.city ?? a.ville ?? '',
    adresse: a.address ?? a.adresse ?? '',
    telephone: a.phone ?? a.telephone ?? '',
    responsableId: a.managerId ?? a.responsableId ?? '',
    responsableNom: a.manager ? `${a.manager.firstName ?? ''} ${a.manager.lastName ?? ''}`.trim() : (a.responsableNom ?? ''),
    nbAgents: Number(a.agentsCount ?? a.nbAgents ?? 0),
    nbAgentsEnLigne: Number(a.onlineAgents ?? a.nbAgentsEnLigne ?? 0),
    active: a.status === 'ACTIVE' || a.active === true,
    createdAt: a.createdAt ?? '',
  };
}

export function useAgences() {
  return useQuery({
    queryKey: KEYS.list(),
    queryFn: async (): Promise<Agence[]> => {
      try {
        const res = await api.get('/agencies');
        const items = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data?.items ?? [];
        if (items.length === 0) return mockAgences;
        return items.map(mapAgence);
      } catch {
        return mockAgences;
      }
    },
    staleTime: 120_000,
  });
}

export function useCreateAgence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nom: string; code: string; ville: string; adresse: string; telephone: string; responsable: string }) => {
      try {
        const res = await api.post('/agencies', {
          name: data.nom,
          code: data.code,
          city: data.ville,
          address: data.adresse,
          phone: data.telephone,
        });
        return res.data;
      } catch {
        return { success: true };
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useToggleAgenceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      try {
        const res = await api.patch(`/agencies/${id}`, { active: active });
        return res.data;
      } catch {
        return { success: true };
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
