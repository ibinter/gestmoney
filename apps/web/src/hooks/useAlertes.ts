import useSWR, { mutate as globalMutate } from 'swr';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

function authFetcher(path: string) {
  return api.get(path).then((r) => r.data);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AlerteEmise {
  id: string;
  tenantId: string;
  type: 'FLOAT_BAS' | 'TRANSACTION_SUSPECTE' | 'EXPIRATION' | 'AUDIT_QUOTIDIEN';
  titre: string;
  detail: string;
  severite: 'INFO' | 'WARNING' | 'CRITICAL';
  lu: boolean;
  createdAt: string;
}

export interface ConfigAlertes {
  id: string;
  tenantId: string;
  seuilFloatBas: number;
  seuilVolumeTransaction: number;
  alerteFloatEmail: boolean;
  alerteFloatInApp: boolean;
  alerteTransactionEmail: boolean;
  alerteExpirationJ7: boolean;
  alerteExpirationJ30: boolean;
  alerteAudit: boolean;
  emailsAlerte: string[];
  updatedAt: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAlertes(opts?: { lu?: boolean; page?: number; limit?: number }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const params = new URLSearchParams();
  if (opts?.lu !== undefined) params.set('lu', String(opts.lu));
  if (opts?.page) params.set('page', String(opts.page));
  if (opts?.limit) params.set('limit', String(opts.limit));

  const key = isAuthenticated ? `/alertes?${params}` : null;
  return useSWR<{ alertes: AlerteEmise[]; total: number; page: number; limit: number }>(
    key,
    authFetcher,
    { refreshInterval: 60_000 },
  );
}

export function useConfigAlertes() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const key = isAuthenticated ? `/alertes/config` : null;
  return useSWR<ConfigAlertes>(key, authFetcher);
}

export async function updateConfigAlertes(data: Partial<ConfigAlertes>) {
  const res = await api.put('/alertes/config', data);
  await globalMutate(`/alertes/config`);
  return res.data;
}

export async function marquerAlerteLue(id: string) {
  await api.patch(`/alertes/${id}/lu`);
  await globalMutate((key: string) => typeof key === 'string' && key.startsWith('/alertes'), undefined, { revalidate: true });
}

export async function marquerToutesLues() {
  await api.patch('/alertes/tout-lire');
  await globalMutate((key: string) => typeof key === 'string' && key.startsWith('/alertes'), undefined, { revalidate: true });
}
