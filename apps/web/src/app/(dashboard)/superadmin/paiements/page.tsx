'use client';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { formatMontant, formatRelativeTime } from '@/lib/formatters';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';
import { useOpsPaiements, useOpsPaiementsStats, type OpsPaiement } from '@/hooks/useSuperadminOps';

type CouleurStatut = 'success' | 'info' | 'danger' | 'warning' | 'neutral';

// Couvre l'ensemble de l'enum PaiementStatut côté API (EN_COURS / EXPIRE inclus).
const STATUT_COULEUR: Record<string, CouleurStatut> = {
  REUSSI: 'success', EN_ATTENTE: 'warning', EN_COURS: 'info', ECHOUE: 'danger',
  REMBOURSE: 'neutral', ANNULE: 'neutral', EXPIRE: 'neutral',
};

// Filtres proposés à l'utilisateur (valeurs d'enum réelles de l'API).
const FILTRES_STATUT = ['REUSSI', 'EN_ATTENTE', 'EN_COURS', 'ECHOUE', 'REMBOURSE', 'ANNULE', 'EXPIRE'];

/** Libellé traduit d'un statut, avec repli sur la valeur brute si non traduit. */
function labelStatut(t: Translations, statut: string): string {
  const map = t.superadmin.paiements.statuts as Record<string, string>;
  if (map[statut]) return map[statut];
  if (statut === 'ECHOUE' && map.ECHEC) return map.ECHEC; // ancienne clé i18n
  return statut;
}

const PROVIDER_ICON: Record<string, string> = {
  CINETPAY: '🟠', MONEROO: '🟣', FEDAPAY: '🔷', PAYSTACK: '🟢', FLUTTERWAVE: '🟡',
  STRIPE: '🔵', MOBILE_MONEY: '📱', VIREMENT: '🏦', ESPECES: '💵', MANUEL: '✍️',
};

export default function PaiementsPage() {
  const t = useT();
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [selected, setSelected] = useState<string | null>(null);

  const params = filtreStatut === 'Tous' ? undefined : { statut: filtreStatut, limit: '100' };
  const { data, isLoading, isError, refetch } = useOpsPaiements(params ?? { limit: '100' });
  const stats = useOpsPaiementsStats();

  const paiements = data?.data ?? [];
  const detail: OpsPaiement | undefined = paiements.find((p) => p.id === selected);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text-main">{t.superadmin.paiements.title}</h1>
        <p className="text-sm text-text-muted">{t.superadmin.paiements.subtitle}</p>
      </div>

      {/* KPIs — agrégats réels (stats globales, indépendants du filtre) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: t.superadmin.paiements.kpi.encaisse, val: stats.data ? formatMontant(stats.data.totalEncaisse) : '—', c: '#009E00' },
          { label: t.superadmin.paiements.kpi.enAttente, val: stats.data ? formatMontant(stats.data.totalEnAttente) : '—', c: '#f59e0b' },
          { label: t.superadmin.paiements.kpi.echecs, val: stats.data ? (stats.data.parStatut.find((s) => s.statut === 'ECHOUE')?.nombre ?? 0) : '—', c: '#E60000' },
          { label: t.superadmin.paiements.kpi.rembourses, val: stats.data ? (stats.data.parStatut.find((s) => s.statut === 'REMBOURSE')?.nombre ?? 0) : '—', c: '#6b7280' },
        ].map((k) => (
          <div key={k.label} className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-border">
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">{k.label}</p>
            <p className="text-xl font-black mt-1 tabular-nums" style={{ color: k.c }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap mb-4">
        {['Tous', ...FILTRES_STATUT].map((s) => (
          <button key={s} onClick={() => setFiltreStatut(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${filtreStatut === s ? 'bg-brand-green text-white border-brand-green' : 'bg-white dark:bg-white/5 text-text-muted border-border hover:border-brand-green'}`}>
            {s === 'Tous' ? t.superadmin.paiements.all : labelStatut(t, s)}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-white/5 rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50 dark:bg-white/3">
                {[t.superadmin.paiements.columns.reference, t.superadmin.paiements.columns.client, t.superadmin.paiements.columns.montant, t.superadmin.paiements.columns.provider, t.superadmin.paiements.columns.periode, t.superadmin.paiements.columns.statut, t.superadmin.paiements.columns.date, ''].map((h, i) => (
                  <th key={`${h}-${i}`} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-text-muted">{t.common.loading}</td></tr>
              )}
              {isError && !isLoading && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm">
                  <span className="text-red-500 font-semibold">{t.common.error}</span>
                  <button onClick={() => refetch()} className="ml-3 text-brand-green font-bold hover:underline">{t.common.refresh}</button>
                </td></tr>
              )}
              {!isLoading && !isError && paiements.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-text-muted">{t.common.noData}</td></tr>
              )}
              {!isLoading && !isError && paiements.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-white/3 cursor-pointer" onClick={() => setSelected(p.id)}>
                  <td className="px-4 py-3 font-mono text-xs text-brand-green font-bold">{p.reference}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-text-main">{p.tenantNom ?? '—'}</p>
                    <p className="text-xs text-text-muted">{p.tenantSlug ?? ''}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums font-bold text-text-main">
                    {formatMontant(p.montant, p.devise)} <span className="text-xs text-text-muted">{p.devise}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                      <span>{PROVIDER_ICON[p.provider] ?? '💳'}</span>{p.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{new Date(p.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3"><Badge couleur={STATUT_COULEUR[p.statut] ?? 'neutral'}>{labelStatut(t, p.statut)}</Badge></td>
                  <td className="px-4 py-3 text-xs text-text-muted">{formatRelativeTime(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-brand-green hover:underline font-semibold">{t.superadmin.paiements.view}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal détail */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-xs font-mono text-brand-green">{detail.reference}</p>
                <h2 className="text-xl font-black text-text-main">{detail.tenantNom ?? '—'}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-text-muted text-xl" aria-label={t.superadmin.paiements.close}>✕</button>
            </div>
            <div className="text-center py-6 mb-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
              <p className="text-4xl font-black tabular-nums text-text-main">{formatMontant(detail.montant, detail.devise)}</p>
              <p className="text-sm text-text-muted">{detail.devise}</p>
              <div className="mt-3"><Badge couleur={STATUT_COULEUR[detail.statut] ?? 'neutral'}>{labelStatut(t, detail.statut)}</Badge></div>
            </div>
            <div className="space-y-2 text-sm mb-4">
              {[
                [t.superadmin.paiements.detail.provider, `${PROVIDER_ICON[detail.provider] ?? '💳'} ${detail.provider}`],
                [t.superadmin.paiements.detail.date, new Date(detail.createdAt).toLocaleString('fr-FR')],
                ['Référence provider', detail.providerRef ?? '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-border last:border-0">
                  <span className="text-text-muted">{k}</span>
                  <span className="font-semibold text-text-main">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
