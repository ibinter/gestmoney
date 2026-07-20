'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard, ChevronRight, CheckCircle2, AlertTriangle,
  TrendingUp, Calendar, Building2, Zap, RefreshCw, X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatMontant, formatRelativeTime } from '@/lib/formatters';
import { clsx } from 'clsx';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

// ─── Données mock ──────────────────────────────────────────────────────────
type PlanId = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';
type StatutLicence = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'EXPIRED' | 'PENDING';

interface Licence {
  id: string;
  tenant: string;
  pays: string;
  plan: PlanId;
  statut: StatutLicence;
  dateDebut: string;
  dateFin: string;
  montantMensuel: number;
  nbUtilisateurs: number;
  nbTransactionsMois: number;
  autoRenouvellement: boolean;
  contact: string;
}

const MOCK_LICENCES: Licence[] = [
  { id: 'L001', tenant: 'OrangeMoney CI', pays: '🇨🇮 Côte d\'Ivoire', plan: 'ENTERPRISE', statut: 'ACTIVE', dateDebut: '2025-01-15', dateFin: '2027-01-15', montantMensuel: 450_000, nbUtilisateurs: 34, nbTransactionsMois: 45_230, autoRenouvellement: true, contact: 'dsi@orangemoney.ci' },
  { id: 'L002', tenant: 'Wave Sénégal', pays: '🇸🇳 Sénégal', plan: 'PROFESSIONAL', statut: 'ACTIVE', dateDebut: '2025-06-01', dateFin: '2026-11-30', montantMensuel: 185_000, nbUtilisateurs: 18, nbTransactionsMois: 28_900, autoRenouvellement: true, contact: 'tech@wavesn.com' },
  { id: 'L003', tenant: 'MTN Ghana', pays: '🇬🇭 Ghana', plan: 'PROFESSIONAL', statut: 'TRIAL', dateDebut: '2026-06-15', dateFin: '2026-08-15', montantMensuel: 0, nbUtilisateurs: 5, nbTransactionsMois: 1_200, autoRenouvellement: false, contact: 'admin@mtn.gh' },
  { id: 'L004', tenant: 'Moov Bénin', pays: '🇧🇯 Bénin', plan: 'STARTER', statut: 'ACTIVE', dateDebut: '2026-03-01', dateFin: '2026-09-01', montantMensuel: 75_000, nbUtilisateurs: 8, nbTransactionsMois: 6_700, autoRenouvellement: true, contact: 'support@moov.bj' },
  { id: 'L005', tenant: 'Airtel Kenya', pays: '🇰🇪 Kenya', plan: 'ENTERPRISE', statut: 'SUSPENDED', dateDebut: '2025-07-01', dateFin: '2026-07-01', montantMensuel: 450_000, nbUtilisateurs: 22, nbTransactionsMois: 0, autoRenouvellement: false, contact: 'billing@airtel.ke' },
  { id: 'L006', tenant: 'Flooz Togo', pays: '🇹🇬 Togo', plan: 'STARTER', statut: 'EXPIRED', dateDebut: '2025-10-01', dateFin: '2026-06-30', montantMensuel: 75_000, nbUtilisateurs: 4, nbTransactionsMois: 0, autoRenouvellement: false, contact: 'admin@flooz.tg' },
];

/** Grille tarifaire pour la langue active (prix et couleurs restent fixes). */
const plans = (t: Translations): Record<PlanId, { label: string; prix: number; couleur: string; fonctionnalites: readonly string[] }> => ({
  STARTER:      { label: t.superadmin.licencesPage.plans.STARTER,      prix: 75_000,  couleur: '#10B981', fonctionnalites: t.superadmin.licencesPage.features.starter },
  PROFESSIONAL: { label: t.superadmin.licencesPage.plans.PROFESSIONAL, prix: 185_000, couleur: '#3B82F6', fonctionnalites: t.superadmin.licencesPage.features.professional },
  ENTERPRISE:   { label: t.superadmin.licencesPage.plans.ENTERPRISE,   prix: 450_000, couleur: '#FFD000', fonctionnalites: t.superadmin.licencesPage.features.enterprise },
  CUSTOM:       { label: t.superadmin.licencesPage.plans.CUSTOM,       prix: 0,       couleur: '#8B5CF6', fonctionnalites: t.superadmin.licencesPage.features.custom },
});

const STATUT_STYLE: Record<StatutLicence, { couleur: string; point: string }> = {
  ACTIVE:    { couleur: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',     point: 'bg-green-500' },
  TRIAL:     { couleur: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',         point: 'bg-blue-400' },
  SUSPENDED: { couleur: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',             point: 'bg-red-500 animate-pulse' },
  EXPIRED:   { couleur: 'bg-gray-100 text-gray-500 dark:bg-white/08 dark:text-gray-400',            point: 'bg-gray-400' },
  PENDING:   { couleur: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300', point: 'bg-yellow-400' },
};

// ─── Modal détail licence ─────────────────────────────────────────────────
function LicenceModal({ licence, onFermer }: { licence: Licence; onFermer: () => void }) {
  const t = useT();
  const plan = plans(t)[licence.plan];
  const statut = { ...STATUT_STYLE[licence.statut], label: t.superadmin.licencesPage.statuts[licence.statut] };
  const joursRestants = Math.ceil((new Date(licence.dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface dark:bg-[hsl(0_0%_10%)] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/08">
          <div>
            <h2 className="font-bold text-text-main">{licence.tenant}</h2>
            <p className="text-xs text-text-muted mt-0.5">{licence.pays} · {licence.contact}</p>
          </div>
          <button onClick={onFermer} className="text-text-muted hover:text-text-main p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/08 transition-colors">
            <X size={16} aria-label={t.superadmin.licencesPage.close} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Plan */}
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: plan.couleur + '12', border: `1px solid ${plan.couleur}30` }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: plan.couleur }}>{t.superadmin.licencesPage.modal.currentPlan}</p>
              <p className="text-lg font-black text-text-main">{plan.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-text-main">{plan.prix > 0 ? formatMontant(plan.prix) : t.superadmin.licencesPage.free}</p>
              <p className="text-xs text-text-muted">{t.superadmin.licencesPage.perMonthLong}</p>
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
              <p className="text-sm font-bold text-text-main mt-1">{new Date(licence.dateFin).toLocaleDateString('fr-FR')}</p>
              <p className={clsx('text-xs mt-0.5', joursRestants < 30 ? 'text-red-500' : 'text-text-muted')}>
                {joursRestants > 0 ? `${t.superadmin.licencesPage.daysLeft}${joursRestants}` : t.superadmin.licencesPage.expired}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-white/04 rounded-xl p-3">
              <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wide">{t.superadmin.licencesPage.modal.utilisateurs}</p>
              <p className="text-sm font-bold text-text-main mt-1">{licence.nbUtilisateurs}</p>
            </div>
            <div className="bg-gray-50 dark:bg-white/04 rounded-xl p-3">
              <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wide">{t.superadmin.licencesPage.modal.txMois}</p>
              <p className="text-sm font-bold text-text-main mt-1">{licence.nbTransactionsMois.toLocaleString('fr-FR')}</p>
            </div>
          </div>

          {/* Fonctionnalités */}
          <div>
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-2">{t.superadmin.licencesPage.modal.included}</p>
            <div className="space-y-1.5">
              {plan.fonctionnalites.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-text-main">
                  <CheckCircle2 size={14} className="text-primary flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {licence.statut === 'SUSPENDED' && (
              <button className="flex-1 flex items-center justify-center gap-2 bg-[#009E00] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#009E00]/90 transition-colors">
                <CheckCircle2 size={15} /> {t.superadmin.licencesPage.modal.reactivate}
              </button>
            )}
            {licence.statut === 'ACTIVE' && (
              <button className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-red-600 transition-colors">
                <X size={15} /> {t.superadmin.licencesPage.modal.suspend}
              </button>
            )}
            <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-sidebar text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
              <RefreshCw size={15} /> {t.superadmin.licencesPage.modal.renew}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function LicencesPage() {
  const t = useT();
  const PLANS = plans(t);
  const router = useRouter();
  const { user } = useAuthStore();
  const [licenceActive, setLicenceActive] = useState<Licence | null>(null);
  const [filtreStatut, setFiltreStatut] = useState<StatutLicence | 'tous'>('tous');

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') router.replace('/dashboard');
  }, [user, router]);

  if (user?.role !== 'SUPER_ADMIN') return null;

  const mrr = MOCK_LICENCES.filter((l) => l.statut === 'ACTIVE').reduce((s, l) => s + l.montantMensuel, 0);
  const arr = mrr * 12;
  const nbActives = MOCK_LICENCES.filter((l) => l.statut === 'ACTIVE').length;
  const nbEssais  = MOCK_LICENCES.filter((l) => l.statut === 'TRIAL').length;
  const nbExpires = MOCK_LICENCES.filter((l) => ['EXPIRED', 'SUSPENDED'].includes(l.statut)).length;

  const licencesFiltrees = MOCK_LICENCES.filter((l) => filtreStatut === 'tous' || l.statut === filtreStatut);

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
          <p className="text-xs text-text-muted mt-0.5">{MOCK_LICENCES.length} {t.superadmin.licencesPage.countSuffix} · {nbActives} {t.superadmin.licencesPage.activesSuffix}</p>
        </div>
      </div>

      {/* KPIs revenus */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t.superadmin.licencesPage.kpi.mrr, valeur: formatMontant(mrr), couleur: '#10B981', icone: <TrendingUp size={16} /> },
          { label: t.superadmin.licencesPage.kpi.arr, valeur: formatMontant(arr), couleur: '#3B82F6', icone: <CreditCard size={16} /> },
          { label: t.superadmin.licencesPage.kpi.trials, valeur: nbEssais.toString(), couleur: '#FFD000', icone: <Zap size={16} /> },
          { label: t.superadmin.licencesPage.kpi.toRenew, valeur: nbExpires.toString(), couleur: '#EF4444', icone: <AlertTriangle size={16} /> },
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

      {/* Plans disponibles */}
      <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 p-6">
        <h2 className="font-bold text-text-main mb-4">{t.superadmin.licencesPage.pricingTitle}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.entries(PLANS) as [PlanId, typeof PLANS[PlanId]][]).map(([id, plan]) => (
            <div key={id} className="rounded-xl p-4" style={{ background: plan.couleur + '0D', border: `1px solid ${plan.couleur}25` }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: plan.couleur }}>{plan.label}</p>
              <p className="text-lg font-black text-text-main mt-1">
                {plan.prix > 0 ? formatMontant(plan.prix) : t.superadmin.licencesPage.quote}
                {plan.prix > 0 && <span className="text-xs font-normal text-text-muted"> {t.superadmin.licencesPage.perMonthShort}</span>}
              </p>
              <div className="mt-2 space-y-1">
                {plan.fonctionnalites.slice(0, 3).map((f) => (
                  <p key={f} className="text-[10px] text-text-muted flex items-center gap-1">
                    <CheckCircle2 size={9} className="flex-shrink-0" style={{ color: plan.couleur }} />
                    {f}
                  </p>
                ))}
              </div>
              <div className="mt-2 text-[10px] font-bold" style={{ color: plan.couleur }}>
                {MOCK_LICENCES.filter((l) => l.plan === id).length} {t.superadmin.licencesPage.clientsSuffix}
              </div>
            </div>
          ))}
        </div>
      </div>

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
            {s === 'tous' ? t.superadmin.licencesPage.all : t.superadmin.licencesPage.statuts[s as StatutLicence]}
            <span className="ml-1.5 opacity-60">
              {s === 'tous' ? MOCK_LICENCES.length : MOCK_LICENCES.filter((l) => l.statut === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/08">
                {[t.superadmin.licencesPage.columns.societe, t.superadmin.licencesPage.columns.plan, t.superadmin.licencesPage.columns.statut, t.superadmin.licencesPage.columns.mrr, t.superadmin.licencesPage.columns.utilisateurs, t.superadmin.licencesPage.columns.txMois, t.superadmin.licencesPage.columns.expiration, ''].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-text-muted px-4 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/05">
              {licencesFiltrees.map((l) => {
                const plan = PLANS[l.plan];
                const statut = { ...STATUT_STYLE[l.statut], label: t.superadmin.licencesPage.statuts[l.statut] };
                const joursRestants = Math.ceil((new Date(l.dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-white/03 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-main">{l.tenant}</p>
                      <p className="text-xs text-text-muted">{l.pays}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: plan.couleur + '18', color: plan.couleur }}>
                        {plan.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full', statut.couleur)}>
                        <span className={clsx('w-1 h-1 rounded-full', statut.point)} />{statut.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-text-main">
                      {l.montantMensuel > 0 ? formatMontant(l.montantMensuel) : <span className="text-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{l.nbUtilisateurs}</td>
                    <td className="px-4 py-3 text-text-muted">{l.nbTransactionsMois.toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-text-muted whitespace-nowrap">{new Date(l.dateFin).toLocaleDateString('fr-FR')}</p>
                      <p className={clsx('text-[10px] mt-0.5', joursRestants < 30 && joursRestants > 0 ? 'text-orange-500' : joursRestants <= 0 ? 'text-red-500' : 'text-text-muted')}>
                        {joursRestants > 0 ? `${t.superadmin.licencesPage.daysLeft}${joursRestants}` : t.superadmin.licencesPage.expired}
                      </p>
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
