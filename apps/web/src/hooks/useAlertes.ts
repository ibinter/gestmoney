import useSWR, { mutate as globalMutate } from 'swr';
import { useAuthStore } from '@/store/authStore';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function authFetcher(url: string, token: string) {
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => {
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
  const token = useAuthStore((s) => s.token);
  const params = new URLSearchParams();
  if (opts?.lu !== undefined) params.set('lu', String(opts.lu));
  if (opts?.page) params.set('page', String(opts.page));
  if (opts?.limit) params.set('limit', String(opts.limit));

  const key = token ? `${API}/alertes?${params}` : null;
  return useSWR<{ alertes: AlerteEmise[]; total: number; page: number; limit: number }>(
    key,
    (url: string) => authFetcher(url, token!),
    { refreshInterval: 60_000 },
  );
}

export function useConfigAlertes() {
  const token = useAuthStore((s) => s.token);
  const key = token ? `${API}/alertes/config` : null;
  return useSWR<ConfigAlertes>(key, (url: string) => authFetcher(url, token!));
}

export async function updateConfigAlertes(token: string, data: Partial<ConfigAlertes>) {
  const res = await fetch(`${API}/alertes/config`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  await globalMutate(`${API}/alertes/config`);
  return res.json();
}

export async function marquerAlerteLue(token: string, id: string) {
  await fetch(`${API}/alertes/${id}/lu`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  await globalMutate((key: string) => typeof key === 'string' && key.startsWith(`${API}/alertes`), undefined, { revalidate: true });
}

export async function marquerToutesLues(token: string) {
  await fetch(`${API}/alertes/tout-lire`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  await globalMutate((key: string) => typeof key === 'string' && key.startsWith(`${API}/alertes`), undefined, { revalidate: true });
}
