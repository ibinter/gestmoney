'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard, ChevronRight, AlertTriangle,
  TrendingUp, Zap, X, Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatMontant } from '@/lib/formatters';
import { clsx } from 'clsx';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';
import { useOpsLicences, useOpsLicencesStats, type OpsLicence } from '@/hooks/useSuperadminOps';

// Statuts réels de l'enum TenantStatus.
type StatutLicence = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'EXPIRED';

const PLAN_COULEUR: Record<string, string> = {
  STARTER: '#10B981', PROFESSIONAL: '#3B82F6', ENTERPRISE: '#FFD000', CUSTOM: '#8B5CF6',
};

const STATUT_STYLE: Record<string, { couleur: string; point: string }> = {
  ACTIVE:    { couleur: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',     point: 'bg-green-500' },
  TRIAL:     { couleur: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',         point: 'bg-blue-400' },
  SUSPENDED: { couleur: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',             point: 'bg-red-500 animate-pulse' },
  EXPIRED:   { couleur: 'bg-gray-100 text-gray-500 dark:bg-white/08 dark:text-gray-400',            point: 'bg-gray-400' },
};

function labelStatut(t: Translations, statut: string): string {
  const map = t.superadmin.licencesPage.statuts as Record<string, string>;
  return map[statut] ?? statut;
}
function labelPlan(t: Translations, plan: string): string {
  const map = t.superadmin.licencesPage.plans as Record<string, string>;
  return map[plan] ?? plan;
}

// ─── Modal détail licence ─────────────────────────────────────────────────
function LicenceModal({ licence, onFermer }: { licence: OpsLicence; onFermer: () => void }) {
  const t = useT();
  const planCouleur = PLAN_COULEUR[licence.plan] ?? '#8B5CF6';
  const statut = { ...(STATUT_STYLE[licence.statut] ?? STATUT_STYLE.EXPIRED), label: labelStatut(t, licence.statut) };
  const joursRestants = licence.echeance
    ? Math.ceil((new Date(licence.echeance).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface dark:bg-[hsl(0_0%_10%)] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/08">
          <div>
            <h2 className="font-bold text-text-main">{licence.tenant}</h2>
            <p className="text-xs text-text-muted mt-0.5">{licence.pays} · {licence.slug}</p>
          </div>
          <button onClick={onFermer} className="text-text-muted hover:text-text-main p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/08 transition-colors">
            <X size={16} aria-label={t.superadmin.licencesPage.close} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Plan */}
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: planCouleur + '12', border: `1px solid ${planCouleur}30` }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: planCouleur }}>{t.superadmin.licencesPage.modal.currentPlan}</p>
              <p className="text-lg font-black text-text-main">{labelPlan(t, licence.plan)}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-text-main">
                {licence.dernierMontant != null ? formatMontant(licence.dernierMontant, licence.devise) : '—'}
              </p>
              {licence.dernierEvenement && (
                <p className="text-xs text-text-muted">{licence.dernierEvenement.type}</p>
              )}
            </div>
          </div>

          {/* Statut & dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-white/04 rounded-xl p-3">
              <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wide">{t.superadmin.licencesPage.modal.statut}</p>
              <span className={clsx('inline-flex items-center gap-1.5 text-xs font-semibold mt-1.5 px-2 py-1 rounded-full', statut.couleur)}>
                <span className={clsx('w-1.5 h-1.5 rounded-full', statut.point)} />{statut.label}
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-white/04 rounded-xl p-3">
              <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wide">{t.superadmin.licencesPage.modal.expiration}</p>
              <p className="text-sm font-bold text-text-main mt-1">{licence.echeance ? new Date(licence.echeance).toLocaleDateString('fr-FR') : '—'}</p>
              {joursRestants != null && (
                <p className={clsx('text-xs mt-0.5', joursRestants < 30 ? 'text-red-500' : 'text-text-muted')}>
                  {joursRestants > 0 ? `${t.superadmin.licencesPage.daysLeft}${joursRestants}` : t.superadmin.licencesPage.expired}
                </p>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-white/04 rounded-xl p-3">
              <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wide">{t.superadmin.licencesPage.modal.utilisateurs}</p>
              <p className="text-sm font-bold text-text-main mt-1">{licence.nbUtilisateurs}</p>
            </div>
            <div className="bg-gray-50 dark:bg-white/04 rounded-xl p-3">
              <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wide">{t.superadmin.licencesPage.columns.plan}</p>
              <p className="text-sm font-bold text-text-main mt-1">{labelPlan(t, licence.plan)}</p>
            </div>
          </div>

          {licence.dernierEvenement?.motif && (
            <div>
              <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-1">{t.superadmin.licencesPage.modal.statut}</p>
              <p className="text-sm text-text-main">{licence.dernierEvenement.motif}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function LicencesPage() {
  const t = useT();
  const router = useRouter();
  const { user } = useAuthStore();
  const [licenceActive, setLicenceActive] = useState<OpsLicence | null>(null);
  const [filtreStatut, setFiltreStatut] = useState<StatutLicence | 'tous'>('tous');

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') router.replace('/dashboard');
  }, [user, router]);

  const params: Record<string, string> = filtreStatut === 'tous' ? { limit: '100' } : { statut: filtreStatut, limit: '100' };
  const { data, isLoading, isError, refetch } = useOpsLicences(params);
  const stats = useOpsLicencesStats();

  if (user?.role !== 'SUPER_ADMIN') return null;

  const licences = data?.data ?? [];
  const nbParStatut = (s: string) => stats.data?.parStatut.find((x) => x.statut === s)?.nombre ?? 0;
  const total = stats.data?.total ?? 0;
  const nbActives = nbParStatut('ACTIVE');
  const nbEssais = nbParStatut('TRIAL');
  const nbExpires = nbParStatut('EXPIRED') + nbParStatut('SUSPENDED');

  return (
    <div className="space-y-8">
      {licenceActive && <LicenceModal licence={licenceActive} onFermer={() => setLicenceActive(null)} />}

      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#FFD000]/15 flex items-center justify-center">
          <CreditCard size={20} className="text-[#b8960a] dark:text-[#FFD000]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/superadmin')} className="text-sm text-text-muted hover:text-text-main transition-colors">{t.superadmin.licencesPage.breadcrumb}</button>
            <ChevronRight size={14} className="text-text-muted" />
            <span className="text-sm font-semibold text-text-main">{t.superadmin.licencesPage.title}</span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">{total} {t.superadmin.licencesPage.countSuffix} · {nbActives} {t.superadmin.licencesPage.activesSuffix}</p>
        </div>
      </div>

      {/* KPIs — MRR/ARR sans source fiable → « — » (règle d'honnêteté) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t.superadmin.licencesPage.kpi.mrr, valeur: stats.data?.mrr != null ? formatMontant(stats.data.mrr) : '—', couleur: '#10B981', icone: <TrendingUp size={16} /> },
          { label: t.superadmin.licencesPage.kpi.arr, valeur: stats.data?.arr != null ? formatMontant(stats.data.arr) : '—', couleur: '#3B82F6', icone: <CreditCard size={16} /> },
          { label: t.superadmin.licencesPage.kpi.trials, valeur: stats.data ? nbEssais.toString() : '—', couleur: '#FFD000', icone: <Zap size={16} /> },
          { label: t.superadmin.licencesPage.kpi.toRenew, valeur: stats.data ? nbExpires.toString() : '—', couleur: '#EF4444', icone: <AlertTriangle size={16} /> },
        ].map((k) => (
          <div key={k.label} className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: k.couleur + '18' }}>
              <span style={{ color: k.couleur }}>{k.icone}</span>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium uppercase tracking-wide">{k.label}</p>
              <p className="text-xl font-black text-text-main mt-0.5">{k.valeur}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Répartition par plan (réelle) */}
      {stats.data && stats.data.parPlan.length > 0 && (
        <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 p-6">
          <h2 className="font-bold text-text-main mb-4">{t.superadmin.licencesPage.pricingTitle}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.data.parPlan.map((p) => {
              const couleur = PLAN_COULEUR[p.plan] ?? '#8B5CF6';
              return (
                <div key={p.plan} className="rounded-xl p-4" style={{ background: couleur + '0D', border: `1px solid ${couleur}25` }}>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: couleur }}>{labelPlan(t, p.plan)}</p>
                  <p className="text-2xl font-black text-text-main mt-1">{p.nombre}</p>
                  <div className="mt-1 text-[10px] font-bold" style={{ color: couleur }}>
                    {p.nombre} {t.superadmin.licencesPage.clientsSuffix}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {(['tous', 'ACTIVE', 'TRIAL', 'SUSPENDED', 'EXPIRED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFiltreStatut(s)}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
              filtreStatut === s
                ? 'bg-primary text-sidebar'
                : 'bg-white dark:bg-white/05 text-text-muted border border-gray-200 dark:border-white/10 hover:border-primary hover:text-primary'
            )}
          >
            {s === 'tous' ? t.superadmin.licencesPage.all : labelStatut(t, s)}
            {stats.data && (
              <span className="ml-1.5 opacity-60">{s === 'tous' ? total : nbParStatut(s)}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/08">
                {[t.superadmin.licencesPage.columns.societe, t.superadmin.licencesPage.columns.plan, t.superadmin.licencesPage.columns.statut, t.superadmin.licencesPage.columns.utilisateurs, t.superadmin.licencesPage.columns.expiration, ''].map((h, i) => (
                  <th key={`${h}-${i}`} className="text-left text-[10px] font-semibold text-text-muted px-4 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/05">
              {isLoading && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-text-muted">{t.common.loading}</td></tr>
              )}
              {isError && !isLoading && (
                <tr><td colSpan={6} className="px-4 py-10 text-center">
                  <span className="text-red-500 font-semibold">{t.common.error}</span>
                  <button onClick={() => refetch()} className="ml-3 text-primary font-bold hover:underline">{t.common.refresh}</button>
                </td></tr>
              )}
              {!isLoading && !isError && licences.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-text-muted">{t.common.noData}</td></tr>
              )}
              {!isLoading && !isError && licences.map((l) => {
                const couleur = PLAN_COULEUR[l.plan] ?? '#8B5CF6';
                const statut = { ...(STATUT_STYLE[l.statut] ?? STATUT_STYLE.EXPIRED), label: labelStatut(t, l.statut) };
                const joursRestants = l.echeance
                  ? Math.ceil((new Date(l.echeance).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;
                return (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-white/03 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-main">{l.tenant}</p>
                      <p className="text-xs text-text-muted">{l.pays}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: couleur + '18', color: couleur }}>
                        {labelPlan(t, l.plan)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full', statut.couleur)}>
                        <span className={clsx('w-1 h-1 rounded-full', statut.point)} />{statut.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      <span className="inline-flex items-center gap-1.5"><Users size={12} />{l.nbUtilisateurs}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-text-muted whitespace-nowrap">{l.echeance ? new Date(l.echeance).toLocaleDateString('fr-FR') : '—'}</p>
                      {joursRestants != null && (
                        <p className={clsx('text-[10px] mt-0.5', joursRestants < 30 && joursRestants > 0 ? 'text-orange-500' : joursRestants <= 0 ? 'text-red-500' : 'text-text-muted')}>
                          {joursRestants > 0 ? `${t.superadmin.licencesPage.daysLeft}${joursRestants}` : t.superadmin.licencesPage.expired}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setLicenceActive(l)}
                        className="text-xs text-primary font-semibold hover:underline whitespace-nowrap"
                      >
                        {t.superadmin.licencesPage.manage}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
