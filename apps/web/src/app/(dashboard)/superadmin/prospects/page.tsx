'use client';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/formatters';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';
import { useProspects, useProspectStats } from '@/hooks/useCrm';

type CouleurStatut = 'info' | 'warning' | 'success' | 'danger' | 'neutral';

// Couleurs pour l'ensemble des statuts réels du modèle Prisma (ProspectStatut).
const STATUT_COULEUR: Record<string, CouleurStatut> = {
  NOUVEAU: 'info',
  A_CONTACTER: 'info',
  CONTACTE: 'info',
  QUALIFIE: 'warning',
  DEMO_PREVUE: 'warning',
  DEMO_REALISEE: 'warning',
  OFFRE_ENVOYEE: 'warning',
  NEGOCIATION: 'warning',
  A_RELANCER: 'warning',
  GAGNE: 'success',
  PERDU: 'danger',
};

/** Humanise une clé d'enum non traduite : A_CONTACTER → "A contacter". */
function humanize(k: string): string {
  const s = k.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Libellé traduit si disponible dans le dictionnaire, sinon humanisé. */
function labelStatut(t: Translations, k: string): string {
  const dict = t.superadmin.prospects.statuts as Record<string, string>;
  return dict[k] ?? humanize(k);
}

function labelOrigine(t: Translations, k: string): string {
  const dict = t.superadmin.prospects.origines as Record<string, string>;
  return dict[k] ?? humanize(k);
}

const PRIORITE_MAP: Record<string, string> = {
  CRITIQUE: '🔴',
  HAUTE: '🔴',
  NORMALE: '🟡',
  MOYENNE: '🟡',
  BASSE: '🟢',
};

const ALL_STATUTS = ['Tous', ...Object.keys(STATUT_COULEUR)];

function dateSeule(iso: string | null): string {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

export default function ProspectsPage() {
  const t = useT();
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [recherche, setRecherche] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const params: Record<string, string> = { limit: '100' };
  if (filtreStatut !== 'Tous') params.statut = filtreStatut;
  if (recherche.trim()) params.search = recherche.trim();

  const { data: prospects = [], isLoading, isError } = useProspects(params);
  const { data: stats } = useProspectStats();

  const detail = prospects.find((p) => p.id === selected);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-text-main">{t.superadmin.prospects.title}</h1>
          <p className="text-sm text-text-muted">{t.superadmin.prospects.subtitle}</p>
        </div>
        <button className="btn-primary text-sm px-4 py-2 rounded-xl font-bold bg-brand-green text-white hover:bg-green-700 transition-colors">
          {t.superadmin.prospects.newProspect}
        </button>
      </div>

      {/* KPIs — issus de l'endpoint /stats (base réelle) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: t.superadmin.prospects.kpi.total, val: stats?.total ?? '—', couleur: '#6366f1' },
          { label: t.superadmin.prospects.kpi.nouveaux, val: stats?.nouveaux ?? '—', couleur: '#0ea5e9' },
          { label: t.superadmin.prospects.kpi.enCours, val: stats?.enCours ?? '—', couleur: '#f59e0b' },
          { label: t.superadmin.prospects.kpi.gagnes, val: stats?.gagnes ?? '—', couleur: '#009E00' },
          { label: t.superadmin.prospects.kpi.conversion, val: stats ? stats.tauxConversion + '%' : '—', couleur: '#FFD000' },
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-border">
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">{k.label}</p>
            <p className="text-2xl font-black mt-1" style={{ color: k.couleur }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          placeholder={t.superadmin.prospects.searchPlaceholder}
          className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-white/5 text-text-main text-sm outline-none focus:border-brand-green"
        />
        <div className="flex gap-2 flex-wrap">
          {ALL_STATUTS.map(s => (
            <button key={s} onClick={() => setFiltreStatut(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors border ${filtreStatut === s ? 'bg-brand-green text-white border-brand-green' : 'bg-white dark:bg-white/5 text-text-muted border-border hover:border-brand-green'}`}>
              {s === 'Tous' ? t.superadmin.prospects.all : labelStatut(t, s)}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-white/5 rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50 dark:bg-white/3">
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">{t.superadmin.prospects.columns.prospect}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">{t.superadmin.prospects.columns.entreprise}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">{t.superadmin.prospects.columns.statut}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">{t.superadmin.prospects.columns.score}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">{t.superadmin.prospects.columns.origine}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">{t.superadmin.prospects.columns.relance}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">{t.superadmin.prospects.columns.ajoute}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-text-muted text-sm">{t.common?.loading ?? '…'}</td></tr>
              )}
              {isError && !isLoading && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-red-500 text-sm">{t.common?.error ?? 'Erreur de chargement'}</td></tr>
              )}
              {!isLoading && !isError && prospects.map((p, i) => (
                <tr key={p.id} className={`border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-white/3 cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30 dark:bg-white/2'}`}
                  onClick={() => setSelected(p.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{PRIORITE_MAP[p.priorite] ?? '⚪'}</span>
                      <div>
                        <p className="font-semibold text-text-main">{p.prenom} {p.nom}</p>
                        <p className="text-xs text-text-muted">{p.email ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-main">{p.entreprise ?? '—'}</p>
                    <p className="text-xs text-text-muted">{p.pays ?? ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge couleur={STATUT_COULEUR[p.statut] ?? 'neutral'}>{labelStatut(t, p.statut)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-white/10 rounded-full h-1.5" style={{ minWidth: 48 }}>
                        <div className="h-full rounded-full bg-brand-green" style={{ width: `${p.score}%` }} />
                      </div>
                      <span className="text-xs font-bold text-text-main tabular-nums">{p.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{labelOrigine(t, p.origine)}</td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {p.dateRelance ? <span className="text-yellow-600 dark:text-yellow-400 font-semibold">{dateSeule(p.dateRelance)}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{formatRelativeTime(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={e => { e.stopPropagation(); setSelected(p.id); }}
                      className="text-xs text-brand-green hover:underline font-semibold">{t.superadmin.prospects.view}</button>
                  </td>
                </tr>
              ))}
              {!isLoading && !isError && prospects.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-text-muted text-sm">{t.superadmin.prospects.empty}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panneau détail */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-black text-text-main">{detail.prenom} {detail.nom}</h2>
                <p className="text-sm text-text-muted">{detail.entreprise ?? '—'} · {detail.pays ?? ''}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-text-muted hover:text-text-main text-xl" aria-label={t.superadmin.prospects.close}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                [t.superadmin.prospects.detail.email, detail.email ?? '—'],
                [t.superadmin.prospects.detail.telephone, detail.telephone ?? '—'],
                [t.superadmin.prospects.detail.secteur, detail.secteur ?? '—'],
                [t.superadmin.prospects.detail.origine, labelOrigine(t, detail.origine)],
                [t.superadmin.prospects.detail.score, detail.score + '/100'],
                [t.superadmin.prospects.detail.priorite, humanize(detail.priorite)],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-text-muted font-semibold">{k}</p>
                  <p className="text-sm font-bold text-text-main mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-bold text-text-main">{t.superadmin.prospects.detail.pipeline}</p>
              <Badge couleur={STATUT_COULEUR[detail.statut] ?? 'neutral'}>{labelStatut(t, detail.statut)}</Badge>
            </div>
            {detail.notes && (
              <p className="text-sm text-text-muted mb-4 bg-gray-50 dark:bg-white/5 rounded-xl p-3">{detail.notes}</p>
            )}
            <div className="flex gap-2 flex-wrap">
              <button className="flex-1 px-4 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-green-700 transition-colors">
                {t.superadmin.prospects.detail.planDemo}
              </button>
              <button className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-text-main hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                {t.superadmin.prospects.detail.creerOffre}
              </button>
              <button className="px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-text-muted hover:text-red-500 transition-colors">
                {t.superadmin.prospects.detail.perdu}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
