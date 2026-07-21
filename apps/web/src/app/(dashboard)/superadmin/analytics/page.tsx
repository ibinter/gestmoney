'use client';
import React, { useMemo, useState } from 'react';
import { useT } from '@/lib/i18n';
import { formatMontant } from '@/lib/formatters';
import { useOpsAnalytics } from '@/hooks/useSuperadminOps';

const PERIODES: Record<string, number> = { '7j': 7, '30j': 30, '90j': 90, '12m': 365 };

const STATUT_COULEUR: Record<string, string> = {
  ACTIVE: '#009E00', TRIAL: '#0ea5e9', SUSPENDED: '#E60000', EXPIRED: '#6b7280',
};

export default function AnalyticsPage() {
  const t = useT();
  const [periode, setPeriode] = useState<keyof typeof PERIODES>('30j');

  const params = useMemo(() => {
    const fin = new Date();
    const debut = new Date(fin.getTime() - PERIODES[periode] * 86400000);
    return { dateDebut: debut.toISOString(), dateFin: fin.toISOString() };
  }, [periode]);

  const { data, isLoading, isError, refetch } = useOpsAnalytics(params);

  const nb = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString('fr-FR'));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-text-main">{t.superadmin.analytics.title}</h1>
          <p className="text-sm text-text-muted">{t.superadmin.analytics.subtitle}</p>
        </div>
        <div className="flex gap-2">
          {Object.keys(PERIODES).map((p) => (
            <button key={p} onClick={() => setPeriode(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${periode === p ? 'bg-brand-green text-white border-brand-green' : 'bg-white dark:bg-white/5 text-text-muted border-border hover:border-brand-green'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-border p-10 text-center">
          <p className="text-red-500 font-semibold">{t.common.error}</p>
          <button onClick={() => refetch()} className="mt-3 text-brand-green font-bold hover:underline">{t.common.refresh}</button>
        </div>
      )}

      {isLoading && !isError && (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-border p-10 text-center text-text-muted">{t.common.loading}</div>
      )}

      {!isLoading && !isError && data && (
        <>
          {/* KPIs — réels. Rebond/conversion sans source → « — ». */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: t.superadmin.analytics.kpi.sessions, val: data.web ? nb(data.web.sessionsUniques) : '—', c: '#009E00' },
              { label: t.common.total + ' tx', val: nb(data.transactions.nombre), c: '#0ea5e9' },
              { label: t.superadmin.analytics.kpi.rebond, val: data.tauxRebond != null ? `${data.tauxRebond}%` : '—', c: '#f59e0b' },
              { label: t.superadmin.analytics.kpi.conversions, val: data.tauxConversion != null ? `${data.tauxConversion}%` : '—', c: '#FFD000' },
            ].map((k) => (
              <div key={k.label} className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-border">
                <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">{k.label}</p>
                <p className="text-2xl font-black mt-1 tabular-nums" style={{ color: k.c }}>{k.val}</p>
              </div>
            ))}
          </div>

          {/* Bloc chiffres réels de la plateforme */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: t.superadmin.licencesPage.modal.utilisateurs, val: nb(data.utilisateurs.total), sub: `${nb(data.utilisateurs.actifs)} ${t.common.inProgress.toLowerCase()}` },
              { label: t.common.total + ' tx', val: nb(data.transactions.nombre), sub: formatMontant(data.transactions.montant) },
              { label: t.superadmin.paiements.kpi.encaisse, val: formatMontant(data.paiements.montantReussi), sub: `${nb(data.paiements.nbReussis)}` },
              { label: t.superadmin.analytics.trafficTitle, val: data.web ? nb(data.web.nbEvenements) : '—', sub: data.web ? '' : t.common.noData },
            ].map((k) => (
              <div key={k.label} className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-border">
                <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">{k.label}</p>
                <p className="text-xl font-black mt-1 tabular-nums text-text-main">{k.val}</p>
                {k.sub && <p className="text-xs text-text-muted mt-0.5">{k.sub}</p>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Établissements par statut (réel) */}
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-border p-5">
              <h2 className="text-base font-bold text-text-main mb-4">{t.superadmin.licencesPage.columns.statut}</h2>
              <div className="space-y-3">
                {data.tenants.parStatut.length === 0 && (
                  <p className="text-sm text-text-muted">{t.common.noData}</p>
                )}
                {data.tenants.parStatut.map((s) => {
                  const maxi = Math.max(...data.tenants.parStatut.map((x) => x.nombre), 1);
                  return (
                    <div key={s.statut}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-text-main">{s.statut}</span>
                        <span className="tabular-nums font-bold text-text-main">{s.nombre}</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(s.nombre / maxi) * 100}%`, background: STATUT_COULEUR[s.statut] ?? '#6b7280' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Événements web par type (réel s'il y en a, sinon « — ») */}
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-border p-5">
              <h2 className="text-base font-bold text-text-main mb-4">{t.superadmin.analytics.topEventsTitle}</h2>
              {!data.web || !data.web.evenementsParType || data.web.evenementsParType.length === 0 ? (
                <p className="text-sm text-text-muted">{t.common.noData}</p>
              ) : (
                <div className="space-y-3">
                  {data.web.evenementsParType.map((e) => (
                    <div key={e.type} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono text-text-main truncate">{e.type}</p>
                      </div>
                      <p className="text-sm font-black tabular-nums text-text-main">{e.nombre.toLocaleString('fr-FR')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top pays (réel s'il y en a) */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-border p-5">
            <h2 className="text-base font-bold text-text-main mb-4">{t.superadmin.analytics.countriesTitle}</h2>
            {!data.web || !data.web.paysTop || data.web.paysTop.length === 0 ? (
              <p className="text-sm text-text-muted">{t.common.noData}</p>
            ) : (
              <div className="space-y-3">
                {data.web.paysTop.map((p, i) => {
                  const maxi = data.web!.paysTop![0]?.sessions || 1;
                  return (
                    <div key={p.pays} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold text-text-main">{p.pays}</span>
                          <span className="tabular-nums font-bold text-text-main">{p.sessions.toLocaleString('fr-FR')}</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(p.sessions / maxi) * 100}%`, background: ['#009E00', '#FFD000', '#0ea5e9', '#8b5cf6', '#f59e0b'][i % 5] }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
