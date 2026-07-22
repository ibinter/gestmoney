'use client';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';
import { useDemonstrations, useDemoStats } from '@/hooks/useCrm';

type CouleurStatut = 'info' | 'warning' | 'success' | 'danger' | 'neutral';

// Couleurs pour l'ensemble des statuts réels du modèle Prisma (DemoStatut).
const STATUT_COULEUR: Record<string, CouleurStatut> = {
  PLANIFIEE: 'info',
  CONFIRMEE: 'info',
  REALISEE: 'success',
  ANNULEE: 'danger',
  REPORTEE: 'warning',
  NO_SHOW: 'danger',
};

function humanize(k: string): string {
  const s = k.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function labelStatut(t: Translations, k: string): string {
  const dict = t.superadmin.demos.statuts as Record<string, string>;
  return dict[k] ?? humanize(k);
}

function labelMode(t: Translations, k: string): string {
  const dict = t.superadmin.demos.modes as Record<string, string>;
  return dict[k] ?? humanize(k);
}

const ALL_STATUTS = ['Tous', ...Object.keys(STATUT_COULEUR)];

function nomProspect(d: { prospect: { nom: string; prenom: string | null } | null; entreprise: string }): string {
  if (d.prospect) return `${d.prospect.prenom ?? ''} ${d.prospect.nom}`.trim();
  return d.entreprise;
}

function datePart(iso: string): string {
  return iso.slice(0, 10);
}
function heurePart(iso: string): string {
  const dt = new Date(iso);
  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function DemonstrationsPage() {
  const t = useT();
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  // Aucun hook de mutation CRM démonstrations n'existe encore (useCrm n'expose que des lectures) :
  // les actions d'écriture affichent un message honnête au lieu de simuler un succès.
  const [toast, setToast] = useState<string | null>(null);
  const notifyComingSoon = () => {
    setToast(t.common.comingSoon);
    setTimeout(() => setToast(null), 2500);
  };

  const params: Record<string, string> = { limit: '100' };
  if (filtreStatut !== 'Tous') params.statut = filtreStatut;

  const { data: demos = [], isLoading, isError } = useDemonstrations(params);
  const { data: stats } = useDemoStats();

  const detail = demos.find((d) => d.id === selected);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-text-main">{t.superadmin.demos.title}</h1>
          <p className="text-sm text-text-muted">{t.superadmin.demos.subtitle}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-green-700 transition-colors">
          {t.superadmin.demos.schedule}
        </button>
      </div>

      {/* KPIs — issus de l'endpoint /stats (base réelle) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: t.superadmin.demos.kpi.total, val: stats?.total ?? '—', c: '#6366f1' },
          { label: t.superadmin.demos.kpi.planifiees, val: stats?.planifiees ?? '—', c: '#0ea5e9' },
          { label: t.superadmin.demos.kpi.realisees, val: stats?.realisees ?? '—', c: '#009E00' },
          { label: t.superadmin.demos.kpi.annulees, val: stats?.annulees ?? '—', c: '#E60000' },
          { label: t.superadmin.demos.kpi.tauxReal, val: stats ? stats.tauxRealisation + '%' : '—', c: '#FFD000' },
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-border">
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">{k.label}</p>
            <p className="text-2xl font-black mt-1" style={{ color: k.c }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 flex-wrap mb-4">
        {ALL_STATUTS.map(s => (
          <button key={s} onClick={() => setFiltreStatut(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${filtreStatut === s ? 'bg-brand-green text-white border-brand-green' : 'bg-white dark:bg-white/5 text-text-muted border-border hover:border-brand-green'}`}>
            {s === 'Tous' ? t.superadmin.demos.all : labelStatut(t, s)}
          </button>
        ))}
      </div>

      {/* États chargement / erreur / vide */}
      {isLoading && <div className="py-16 text-center text-text-muted text-sm">{t.common?.loading ?? '…'}</div>}
      {isError && !isLoading && <div className="py-16 text-center text-red-500 text-sm">{t.common?.error ?? 'Erreur de chargement'}</div>}
      {!isLoading && !isError && demos.length === 0 && (
        <div className="py-16 text-center text-text-muted text-sm">Aucune démonstration</div>
      )}

      {/* Cartes */}
      {!isLoading && !isError && demos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {demos.map(d => (
            <div key={d.id} onClick={() => setSelected(d.id)}
              className="bg-white dark:bg-white/5 rounded-2xl border border-border p-5 cursor-pointer hover:border-brand-green transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-text-main">{nomProspect(d)}</p>
                  <p className="text-xs text-text-muted">{d.entreprise}</p>
                </div>
                <Badge couleur={STATUT_COULEUR[d.statut] ?? 'neutral'}>{labelStatut(t, d.statut)}</Badge>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-text-muted">
                  <span>📅</span><span>{datePart(d.date)} {t.superadmin.demos.at} {heurePart(d.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-text-muted">
                  <span>{labelMode(t, d.mode)}</span>
                </div>
                {d.notes && (
                  <p className="text-xs text-text-muted mt-2 border-t border-border pt-2 line-clamp-2">{d.notes}</p>
                )}
              </div>
              {d.statut === 'PLANIFIEE' && d.lienVisio && (
                <a href={d.lienVisio} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  className="mt-3 flex items-center gap-1.5 text-xs font-bold text-brand-green hover:underline">
                  {t.superadmin.demos.join}
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal détail */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-black text-text-main">{nomProspect(detail)}</h2>
                <p className="text-sm text-text-muted">{detail.entreprise}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-text-muted hover:text-text-main text-xl" aria-label={t.superadmin.demos.close}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                [t.superadmin.demos.detail.date, `${datePart(detail.date)} ${heurePart(detail.date)}`],
                [t.superadmin.demos.detail.mode, labelMode(t, detail.mode)],
                [t.superadmin.demos.detail.fuseau, detail.fuseau],
                [t.superadmin.demos.detail.animateur, detail.agentId ?? '—'],
                [t.superadmin.demos.detail.statut, labelStatut(t, detail.statut)],
                [t.superadmin.demos.detail.email, detail.prospect?.email ?? '—'],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-text-muted font-semibold">{k}</p>
                  <p className="text-sm font-bold text-text-main mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            {detail.notes && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-4">
                <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400 mb-1">{t.superadmin.demos.detail.notes}</p>
                <p className="text-sm text-yellow-900 dark:text-yellow-200">{detail.notes}</p>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {detail.statut === 'PLANIFIEE' && (
                <>
                  <button onClick={notifyComingSoon} title={t.common.comingSoon} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold">{t.superadmin.demos.detail.markDone}</button>
                  <button onClick={notifyComingSoon} title={t.common.comingSoon} className="px-4 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-bold">{t.superadmin.demos.detail.cancel}</button>
                </>
              )}
              {detail.statut === 'REALISEE' && (
                <button onClick={notifyComingSoon} title={t.common.comingSoon} className="flex-1 px-4 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold">{t.superadmin.demos.detail.createOffer}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <h2 className="text-xl font-black text-text-main">{t.superadmin.demos.form.title}</h2>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-main text-xl" aria-label={t.superadmin.demos.close}>✕</button>
            </div>
            <div className="space-y-3">
              {[
                { label: t.superadmin.demos.form.prospect, type: 'email', placeholder: t.superadmin.demos.form.prospectPlaceholder },
                { label: t.superadmin.demos.form.date, type: 'date', placeholder: '' },
                { label: t.superadmin.demos.form.heure, type: 'time', placeholder: '' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-bold text-text-muted block mb-1">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-white/5 text-text-main text-sm outline-none focus:border-brand-green" />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-text-muted block mb-1">{t.superadmin.demos.form.mode}</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-white/5 text-text-main text-sm outline-none focus:border-brand-green">
                  <option value="VISIO">{t.superadmin.demos.form.visio}</option>
                  <option value="PRESENTIEL">{t.superadmin.demos.form.presentiel}</option>
                  <option value="TELEPHONE">{t.superadmin.demos.form.telephone}</option>
                </select>
              </div>
              <button onClick={notifyComingSoon} title={t.common.comingSoon} className="w-full py-3 rounded-xl bg-brand-green text-white font-bold text-sm hover:bg-green-700 transition-colors">
                {t.superadmin.demos.form.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
