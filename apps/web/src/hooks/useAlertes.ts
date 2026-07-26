import useSWR, { mutate as globalMutate } from 'swr';
import { useAuthStore } from '@/store/authStore';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function authFetcher(url: string) {
  return fetch(url, { credentials: 'include' }).then((r) => {
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  });
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

  const key = isAuthenticated ? `${API}/alertes?${params}` : null;
  return useSWR<{ alertes: AlerteEmise[]; total: number; page: number; limit: number }>(
    key,
    authFetcher,
    { refreshInterval: 60_000 },
  );
}

export function useConfigAlertes() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const key = isAuthenticated ? `${API}/alertes/config` : null;
  return useSWR<ConfigAlertes>(key, authFetcher);
}

export async function updateConfigAlertes(data: Partial<ConfigAlertes>) {
  const res = await fetch(`${API}/alertes/config`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  await globalMutate(`${API}/alertes/config`);
  return res.json();
}

export async function marquerAlerteLue(id: string) {
  await fetch(`${API}/alertes/${id}/lu`, {
    method: 'PATCH',
    credentials: 'include',
  });
  await globalMutate((key: string) => typeof key === 'string' && key.startsWith(`${API}/alertes`), undefined, { revalidate: true });
}

export async function marquerToutesLues() {
  await fetch(`${API}/alertes/tout-lire`, {
    method: 'PATCH',
    credentials: 'include',
  });
  await globalMutate((key: string) => typeof key === 'string' && key.startsWith(`${API}/alertes`), undefined, { revalidate: true });
}
