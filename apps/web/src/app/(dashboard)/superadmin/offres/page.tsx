'use client';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { formatMontant } from '@/lib/formatters';

const OFFRES = [
  { id: 'OFF-001', prospect: 'Fatoumata Diallo', entreprise: 'Wave SN', email: 'fdiallo@wave.com', plan: 'PROFESSIONAL', prixHT: 1788000, remise: 10, taxes: 18, statut: 'ENVOYEE', validiteJours: 30, dateCreation: '2026-07-10', dateExpiration: '2026-08-09' },
  { id: 'OFF-002', prospect: 'Mamadou Koné', entreprise: 'Orange CI', email: 'mkone@orange.ci', plan: 'ENTERPRISE', prixHT: 5000000, remise: 15, taxes: 18, statut: 'EN_NEGOCIATION', validiteJours: 30, dateCreation: '2026-07-12', dateExpiration: '2026-08-11' },
  { id: 'OFF-003', prospect: 'Kwame Asante', entreprise: 'MTN GH', email: 'kasante@mtn.gh', plan: 'STARTER', prixHT: 588000, remise: 0, taxes: 15, statut: 'BROUILLON', validiteJours: 15, dateCreation: '2026-07-13', dateExpiration: '2026-07-28' },
  { id: 'OFF-004', prospect: 'Ama Mensah', entreprise: 'Airtel KE', email: 'amensah@airtel.ke', plan: 'ENTERPRISE', prixHT: 4800000, remise: 20, taxes: 16, statut: 'CONVERTIE', validiteJours: 30, dateCreation: '2026-06-15', dateExpiration: '2026-07-15' },
  { id: 'OFF-005', prospect: 'Ibrahim Touré', entreprise: 'Moov BJ', email: 'itoure@moov.bj', plan: 'PROFESSIONAL', prixHT: 1788000, remise: 5, taxes: 18, statut: 'EXPIREE', validiteJours: 30, dateCreation: '2026-05-01', dateExpiration: '2026-05-31' },
];

const STATUT_MAP: Record<string, { label: string; couleur: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }> = {
  BROUILLON: { label: 'Brouillon', couleur: 'neutral' },
  ENVOYEE: { label: 'Envoyée', couleur: 'info' },
  EN_NEGOCIATION: { label: 'Négociation', couleur: 'warning' },
  CONVERTIE: { label: 'Convertie ✓', couleur: 'success' },
  REFUSEE: { label: 'Refusée', couleur: 'danger' },
  EXPIREE: { label: 'Expirée', couleur: 'neutral' },
};

const PLAN_PRIX: Record<string, number> = {
  STARTER: 49000,
  PROFESSIONAL: 149000,
  ENTERPRISE: 0,
};

function prixTTC(ht: number, remise: number, taxes: number) {
  const apresRemise = ht * (1 - remise / 100);
  return Math.round(apresRemise * (1 + taxes / 100));
}

export default function OffresPage() {
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = OFFRES.filter(o => filtreStatut === 'Tous' || o.statut === filtreStatut);
  const detail = OFFRES.find(o => o.id === selected);

  const mrr = OFFRES.filter(o => o.statut === 'CONVERTIE').reduce((s, o) => s + o.prixHT * (1 - o.remise / 100), 0);
  const pipeline = OFFRES.filter(o => ['ENVOYEE','EN_NEGOCIATION'].includes(o.statut)).reduce((s, o) => s + o.prixHT * (1 - o.remise / 100), 0);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-text-main">Offres & Devis</h1>
          <p className="text-sm text-text-muted">Gestion des propositions commerciales</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-green-700 transition-colors">
          + Nouvelle offre
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pipeline', val: formatMontant(pipeline) + ' XOF', c: '#0ea5e9' },
          { label: 'Converties', val: OFFRES.filter(o => o.statut === 'CONVERTIE').length, c: '#009E00' },
          { label: 'En cours', val: OFFRES.filter(o => ['ENVOYEE','EN_NEGOCIATION'].includes(o.statut)).length, c: '#f59e0b' },
          { label: 'Taux conv.', val: Math.round(OFFRES.filter(o=>o.statut==='CONVERTIE').length / OFFRES.filter(o=>o.statut!=='BROUILLON').length * 100) + '%', c: '#FFD000' },
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-border">
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">{k.label}</p>
            <p className="text-xl font-black mt-1 tabular-nums" style={{ color: k.c }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap mb-4">
        {['Tous', ...Object.keys(STATUT_MAP)].map(s => (
          <button key={s} onClick={() => setFiltreStatut(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${filtreStatut === s ? 'bg-brand-green text-white border-brand-green' : 'bg-white dark:bg-white/5 text-text-muted border-border hover:border-brand-green'}`}>
            {s === 'Tous' ? 'Toutes' : STATUT_MAP[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-white/5 rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50 dark:bg-white/3">
                {['Référence', 'Prospect', 'Plan', 'HT', 'Remise', 'TTC', 'Statut', 'Expiration', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const ttc = prixTTC(o.prixHT, o.remise, o.taxes);
                const expire = new Date(o.dateExpiration) < new Date() && o.statut !== 'CONVERTIE';
                return (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-white/3 cursor-pointer" onClick={() => setSelected(o.id)}>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-brand-green">{o.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-main">{o.prospect}</p>
                      <p className="text-xs text-text-muted">{o.entreprise}</p>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg">{o.plan}</span></td>
                    <td className="px-4 py-3 tabular-nums text-text-muted text-xs">{formatMontant(o.prixHT)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-green-600">{o.remise > 0 ? `-${o.remise}%` : '—'}</td>
                    <td className="px-4 py-3 tabular-nums font-bold text-text-main">{formatMontant(ttc)}</td>
                    <td className="px-4 py-3"><Badge couleur={STATUT_MAP[o.statut]?.couleur ?? 'neutral'}>{STATUT_MAP[o.statut]?.label}</Badge></td>
                    <td className="px-4 py-3 text-xs" style={{ color: expire ? '#E60000' : 'inherit' }}>{o.dateExpiration}</td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-brand-green hover:underline font-semibold">Voir</button>
                    </td>
                  </tr>
                );
              })}
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
                <p className="text-xs font-mono text-brand-green font-bold">{detail.id}</p>
                <h2 className="text-xl font-black text-text-main">{detail.prospect}</h2>
                <p className="text-sm text-text-muted">{detail.entreprise}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-text-muted text-xl">✕</button>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-5 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Plan</span>
                <span className="font-bold text-text-main">{detail.plan}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Prix HT</span>
                <span className="font-bold tabular-nums">{formatMontant(detail.prixHT)} XOF</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Remise</span>
                <span className="font-bold text-green-600">{detail.remise > 0 ? `-${detail.remise}%` : 'Aucune'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Taxes ({detail.taxes}%)</span>
                <span className="font-bold tabular-nums">{formatMontant(Math.round(detail.prixHT * (1-detail.remise/100) * detail.taxes/100))} XOF</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm">
                <span className="font-bold text-text-main">Total TTC</span>
                <span className="font-black text-lg text-brand-green tabular-nums">{formatMontant(prixTTC(detail.prixHT, detail.remise, detail.taxes))} XOF</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                <p className="text-text-muted">Créée le</p><p className="font-bold">{detail.dateCreation}</p>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                <p className="text-text-muted">Expire le</p><p className="font-bold">{detail.dateExpiration}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {detail.statut === 'BROUILLON' && <button className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold">📧 Envoyer</button>}
              {['ENVOYEE','EN_NEGOCIATION'].includes(detail.statut) && <button className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold">✓ Marquer convertie</button>}
              <button className="px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-text-muted">📥 PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
