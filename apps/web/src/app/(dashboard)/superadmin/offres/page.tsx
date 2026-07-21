'use client';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { formatMontant } from '@/lib/formatters';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';
import { useOffres, useOffreStats } from '@/hooks/useCrm';

type CouleurStatut = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

// Couleurs pour l'ensemble des statuts réels du modèle Prisma (OffreStatut).
const STATUT_COULEUR: Record<string, CouleurStatut> = {
  BROUILLON: 'neutral',
  ENVOYEE: 'info',
  CONSULTEE: 'warning',
  ACCEPTEE: 'success',
  CONVERTIE: 'success',
  REFUSEE: 'danger',
  EXPIREE: 'neutral',
};

function humanize(k: string): string {
  const s = k.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function labelStatut(t: Translations, k: string): string {
  const dict = t.superadmin.offres.statuts as Record<string, string>;
  return dict[k] ?? humanize(k);
}

const ALL_STATUTS = ['Tous', ...Object.keys(STATUT_COULEUR)];

function datePart(iso: string): string {
  return iso.slice(0, 10);
}

function nomProspect(o: { prospect: { nom: string; prenom: string | null } | null; entreprise: string }): string {
  if (o.prospect) return `${o.prospect.prenom ?? ''} ${o.prospect.nom}`.trim();
  return o.entreprise;
}

export default function OffresPage() {
  const t = useT();
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const params: Record<string, string> = { limit: '100' };
  if (filtreStatut !== 'Tous') params.statut = filtreStatut;

  const { data: offres = [], isLoading, isError } = useOffres(params);
  const { data: stats } = useOffreStats();

  const detail = offres.find((o) => o.id === selected);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-text-main">{t.superadmin.offres.title}</h1>
          <p className="text-sm text-text-muted">{t.superadmin.offres.subtitle}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-green-700 transition-colors">
          {t.superadmin.offres.newOffer}
        </button>
      </div>

      {/* KPIs — issus de l'endpoint /stats (base réelle) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: t.superadmin.offres.kpi.pipeline, val: stats ? formatMontant(stats.pipeline) + ' XOF' : '—', c: '#0ea5e9' },
          { label: t.superadmin.offres.kpi.converties, val: stats?.converties ?? '—', c: '#009E00' },
          { label: t.superadmin.offres.kpi.enCours, val: stats?.enCours ?? '—', c: '#f59e0b' },
          { label: t.superadmin.offres.kpi.tauxConv, val: stats ? stats.tauxConversion + '%' : '—', c: '#FFD000' },
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-border">
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">{k.label}</p>
            <p className="text-xl font-black mt-1 tabular-nums" style={{ color: k.c }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap mb-4">
        {ALL_STATUTS.map(s => (
          <button key={s} onClick={() => setFiltreStatut(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${filtreStatut === s ? 'bg-brand-green text-white border-brand-green' : 'bg-white dark:bg-white/5 text-text-muted border-border hover:border-brand-green'}`}>
            {s === 'Tous' ? t.superadmin.offres.all : labelStatut(t, s)}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-white/5 rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50 dark:bg-white/3">
                {[t.superadmin.offres.columns.reference, t.superadmin.offres.columns.prospect, t.superadmin.offres.columns.plan, t.superadmin.offres.columns.ht, t.superadmin.offres.columns.remise, t.superadmin.offres.columns.ttc, t.superadmin.offres.columns.statut, t.superadmin.offres.columns.expiration, ''].map((h, idx) => (
                  <th key={idx} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-text-muted text-sm">{t.common?.loading ?? '…'}</td></tr>
              )}
              {isError && !isLoading && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-red-500 text-sm">{t.common?.error ?? 'Erreur de chargement'}</td></tr>
              )}
              {!isLoading && !isError && offres.map(o => {
                const expire = new Date(o.dateExpiration) < new Date() && o.statut !== 'CONVERTIE' && o.statut !== 'ACCEPTEE';
                return (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-white/3 cursor-pointer" onClick={() => setSelected(o.id)}>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-brand-green">{o.reference}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-main">{nomProspect(o)}</p>
                      <p className="text-xs text-text-muted">{o.entreprise}</p>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg">{o.formule ?? '—'}</span></td>
                    <td className="px-4 py-3 tabular-nums text-text-muted text-xs">{formatMontant(o.prixHT)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-green-600">{o.remise > 0 ? `-${o.remise}%` : '—'}</td>
                    <td className="px-4 py-3 tabular-nums font-bold text-text-main">{formatMontant(o.prixTTC)}</td>
                    <td className="px-4 py-3"><Badge couleur={STATUT_COULEUR[o.statut] ?? 'neutral'}>{labelStatut(t, o.statut)}</Badge></td>
                    <td className="px-4 py-3 text-xs" style={{ color: expire ? '#E60000' : 'inherit' }}>{datePart(o.dateExpiration)}</td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-brand-green hover:underline font-semibold">{t.superadmin.offres.view}</button>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && !isError && offres.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-text-muted text-sm">Aucune offre</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal détail */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-xs font-mono text-brand-green font-bold">{detail.reference}</p>
                <h2 className="text-xl font-black text-text-main">{nomProspect(detail)}</h2>
                <p className="text-sm text-text-muted">{detail.entreprise}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-text-muted text-xl" aria-label={t.superadmin.offres.close}>✕</button>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-5 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t.superadmin.offres.detail.plan}</span>
                <span className="font-bold text-text-main">{detail.formule ?? '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t.superadmin.offres.detail.prixHT}</span>
                <span className="font-bold tabular-nums">{formatMontant(detail.prixHT)} {detail.devise}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t.superadmin.offres.detail.remise}</span>
                <span className="font-bold text-green-600">{detail.remise > 0 ? `-${detail.remise}%` : t.superadmin.offres.detail.aucune}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t.superadmin.offres.detail.taxes} ({detail.taxes}%)</span>
                <span className="font-bold tabular-nums">{formatMontant(Math.round(detail.prixHT * (1 - detail.remise / 100) * detail.taxes / 100))} {detail.devise}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm">
                <span className="font-bold text-text-main">{t.superadmin.offres.detail.totalTTC}</span>
                <span className="font-black text-lg text-brand-green tabular-nums">{formatMontant(detail.prixTTC)} {detail.devise}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                <p className="text-text-muted">{t.superadmin.offres.detail.creeeLe}</p><p className="font-bold">{datePart(detail.createdAt)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                <p className="text-text-muted">{t.superadmin.offres.detail.expireLe}</p><p className="font-bold">{datePart(detail.dateExpiration)}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {detail.statut === 'BROUILLON' && <button className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold">{t.superadmin.offres.detail.send}</button>}
              {['ENVOYEE', 'CONSULTEE'].includes(detail.statut) && <button className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold">{t.superadmin.offres.detail.markConverted}</button>}
              <button className="px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-text-muted">{t.superadmin.offres.detail.pdf}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
