'use client';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/formatters';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

const PROSPECTS = [
  { id: '1', nom: 'Koné', prenom: 'Mamadou', entreprise: 'Orange CI', email: 'mkone@orange.ci', telephone: '+225 07 00 00 01', pays: 'Côte d\'Ivoire', secteur: 'Mobile Money', statut: 'QUALIFICATION', priorite: 'HAUTE', score: 85, origine: 'DEMO', dateRelance: '2026-07-20', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: '2', nom: 'Diallo', prenom: 'Fatoumata', entreprise: 'Wave SN', email: 'fdiallo@wave.com', telephone: '+221 77 00 00 02', pays: 'Sénégal', secteur: 'FinTech', statut: 'PROPOSITION', priorite: 'HAUTE', score: 92, origine: 'SITE_WEB', dateRelance: '2026-07-18', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: '3', nom: 'Asante', prenom: 'Kwame', entreprise: 'MTN GH', email: 'kasante@mtn.gh', telephone: '+233 24 000 003', pays: 'Ghana', secteur: 'Télécoms', statut: 'NOUVEAU', priorite: 'MOYENNE', score: 60, origine: 'PARTENAIRE', dateRelance: null, createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: '4', nom: 'Touré', prenom: 'Ibrahim', entreprise: 'Moov BJ', email: 'itoure@moov.bj', telephone: '+229 97 00 00 04', pays: 'Bénin', secteur: 'Mobile Money', statut: 'NEGOCIATION', priorite: 'HAUTE', score: 78, origine: 'SARA', dateRelance: '2026-07-15', createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: '5', nom: 'Mensah', prenom: 'Ama', entreprise: 'Airtel KE', email: 'amensah@airtel.ke', telephone: '+254 71 000 005', pays: 'Kenya', secteur: 'Télécoms', statut: 'GAGNE', priorite: 'HAUTE', score: 100, origine: 'EVENEMENT', dateRelance: null, createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: '6', nom: 'Bah', prenom: 'Aminata', entreprise: 'FinCash ML', email: 'abah@fincash.ml', telephone: '+223 70 00 00 06', pays: 'Mali', secteur: 'FinTech', statut: 'PERDU', priorite: 'BASSE', score: 20, origine: 'COLD_EMAIL', dateRelance: null, createdAt: new Date(Date.now() - 45 * 86400000).toISOString() },
];

type CouleurStatut = 'info' | 'warning' | 'success' | 'danger' | 'neutral';

const STATUT_COULEUR: Record<string, CouleurStatut> = {
  NOUVEAU: 'info', QUALIFICATION: 'warning', PROPOSITION: 'warning',
  NEGOCIATION: 'warning', GAGNE: 'success', PERDU: 'danger',
};

/** Libellé + couleur de statut pour la langue active. */
const statutMap = (t: Translations): Record<string, { label: string; couleur: CouleurStatut }> =>
  Object.fromEntries(
    Object.keys(STATUT_COULEUR).map((k) => [k, { label: t.superadmin.prospects.statuts[k as keyof typeof t.superadmin.prospects.statuts], couleur: STATUT_COULEUR[k] }]),
  );

const PRIORITE_MAP: Record<string, string> = {
  HAUTE: '🔴',
  MOYENNE: '🟡',
  BASSE: '🟢',
};

const origineMap = (t: Translations): Record<string, string> => t.superadmin.prospects.origines;

const ALL_STATUTS = ['Tous', 'NOUVEAU', 'QUALIFICATION', 'PROPOSITION', 'NEGOCIATION', 'GAGNE', 'PERDU'];

export default function ProspectsPage() {
  const t = useT();
  const STATUT_MAP = statutMap(t);
  const ORIGINE_MAP = origineMap(t);
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [recherche, setRecherche] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = PROSPECTS.filter(p => {
    const matchStatut = filtreStatut === 'Tous' || p.statut === filtreStatut;
    const q = recherche.toLowerCase();
    const matchRech = !q || p.nom.toLowerCase().includes(q) || p.entreprise.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
    return matchStatut && matchRech;
  });

  const detail = PROSPECTS.find(p => p.id === selected);

  const stats = {
    total: PROSPECTS.length,
    nouveaux: PROSPECTS.filter(p => p.statut === 'NOUVEAU').length,
    enCours: PROSPECTS.filter(p => ['QUALIFICATION','PROPOSITION','NEGOCIATION'].includes(p.statut)).length,
    gagnes: PROSPECTS.filter(p => p.statut === 'GAGNE').length,
    tauxConversion: Math.round(PROSPECTS.filter(p => p.statut === 'GAGNE').length / PROSPECTS.length * 100),
  };

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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: t.superadmin.prospects.kpi.total, val: stats.total, couleur: '#6366f1' },
          { label: t.superadmin.prospects.kpi.nouveaux, val: stats.nouveaux, couleur: '#0ea5e9' },
          { label: t.superadmin.prospects.kpi.enCours, val: stats.enCours, couleur: '#f59e0b' },
          { label: t.superadmin.prospects.kpi.gagnes, val: stats.gagnes, couleur: '#009E00' },
          { label: t.superadmin.prospects.kpi.conversion, val: stats.tauxConversion + '%', couleur: '#FFD000' },
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
              {s === 'Tous' ? t.superadmin.prospects.all : STATUT_MAP[s]?.label ?? s}
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
              {filtered.map((p, i) => (
                <tr key={p.id} className={`border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-white/3 cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30 dark:bg-white/2'}`}
                  onClick={() => setSelected(p.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{PRIORITE_MAP[p.priorite]}</span>
                      <div>
                        <p className="font-semibold text-text-main">{p.prenom} {p.nom}</p>
                        <p className="text-xs text-text-muted">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-main">{p.entreprise}</p>
                    <p className="text-xs text-text-muted">{p.pays}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge couleur={STATUT_MAP[p.statut]?.couleur ?? 'neutral'}>{STATUT_MAP[p.statut]?.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-white/10 rounded-full h-1.5" style={{ minWidth: 48 }}>
                        <div className="h-full rounded-full bg-brand-green" style={{ width: `${p.score}%` }} />
                      </div>
                      <span className="text-xs font-bold text-text-main tabular-nums">{p.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{ORIGINE_MAP[p.origine] ?? p.origine}</td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {p.dateRelance ? <span className="text-yellow-600 dark:text-yellow-400 font-semibold">{p.dateRelance}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{formatRelativeTime(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={e => { e.stopPropagation(); setSelected(p.id); }}
                      className="text-xs text-brand-green hover:underline font-semibold">{t.superadmin.prospects.view}</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
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
                <p className="text-sm text-text-muted">{detail.entreprise} · {detail.pays}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-text-muted hover:text-text-main text-xl" aria-label={t.superadmin.prospects.close}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                [t.superadmin.prospects.detail.email, detail.email],
                [t.superadmin.prospects.detail.telephone, detail.telephone],
                [t.superadmin.prospects.detail.secteur, detail.secteur],
                [t.superadmin.prospects.detail.origine, ORIGINE_MAP[detail.origine]],
                [t.superadmin.prospects.detail.score, detail.score + '/100'],
                [t.superadmin.prospects.detail.priorite, detail.priorite],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-text-muted font-semibold">{k}</p>
                  <p className="text-sm font-bold text-text-main mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-bold text-text-main">{t.superadmin.prospects.detail.pipeline}</p>
              <Badge couleur={STATUT_MAP[detail.statut]?.couleur ?? 'neutral'}>{STATUT_MAP[detail.statut]?.label}</Badge>
            </div>
            {/* Pipeline steps */}
            <div className="flex gap-1 mb-6 overflow-x-auto">
              {['NOUVEAU','QUALIFICATION','PROPOSITION','NEGOCIATION','GAGNE'].map((s, i) => {
                const steps = ['NOUVEAU','QUALIFICATION','PROPOSITION','NEGOCIATION','GAGNE','PERDU'];
                const idx = steps.indexOf(detail.statut);
                const stepIdx = steps.indexOf(s);
                const active = stepIdx <= idx && detail.statut !== 'PERDU';
                return (
                  <div key={s} className="flex-1 min-w-[60px]">
                    <div className={`h-1.5 rounded-full ${active ? 'bg-brand-green' : 'bg-gray-200 dark:bg-white/10'}`} />
                    <p className={`text-[10px] mt-1 text-center font-semibold ${active ? 'text-brand-green' : 'text-text-muted'}`}>{STATUT_MAP[s]?.label ?? s}</p>
                  </div>
                );
              })}
            </div>
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
