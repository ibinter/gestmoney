'use client';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { formatMontant, formatRelativeTime } from '@/lib/formatters';

const PAIEMENTS = [
  { id: 'PAY-001', reference: 'REF-2026-0001', tenant: 'Wave SN', email: 'admin@wavesn.com', montant: 149000, devise: 'XOF', provider: 'CINETPAY', statut: 'REUSSI', plan: 'PROFESSIONAL', periode: 'Juillet 2026', date: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'PAY-002', reference: 'REF-2026-0002', tenant: 'Orange CI', email: 'admin@orange.ci', montant: 500000, devise: 'XOF', provider: 'VIREMENT', statut: 'REUSSI', plan: 'ENTERPRISE', periode: 'Q3 2026', date: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'PAY-003', reference: 'REF-2026-0003', tenant: 'Moov BJ', email: 'admin@moov.bj', montant: 49000, devise: 'XOF', provider: 'MOBILE_MONEY', statut: 'EN_ATTENTE', plan: 'STARTER', periode: 'Juillet 2026', date: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'PAY-004', reference: 'REF-2026-0004', tenant: 'MTN GH', email: 'admin@mtn.gh', montant: 149000, devise: 'GHS', provider: 'STRIPE', statut: 'ECHEC', plan: 'PROFESSIONAL', periode: 'Juillet 2026', date: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'PAY-005', reference: 'REF-2026-0005', tenant: 'Airtel KE', email: 'admin@airtel.ke', montant: 500000, devise: 'KES', provider: 'STRIPE', statut: 'REMBOURSE', plan: 'ENTERPRISE', periode: 'Juin 2026', date: new Date(Date.now() - 20 * 86400000).toISOString() },
];

const STATUT_MAP: Record<string, { label: string; couleur: 'success' | 'info' | 'danger' | 'warning' | 'neutral' }> = {
  REUSSI: { label: 'Réussi ✓', couleur: 'success' },
  EN_ATTENTE: { label: 'En attente', couleur: 'warning' },
  ECHEC: { label: 'Échoué', couleur: 'danger' },
  REMBOURSE: { label: 'Remboursé', couleur: 'neutral' },
  ANNULE: { label: 'Annulé', couleur: 'neutral' },
};

const PROVIDER_ICON: Record<string, string> = {
  CINETPAY: '🟠', STRIPE: '🔵', MOBILE_MONEY: '📱',
  VIREMENT: '🏦', PAYSTACK: '🟢', FLUTTERWAVE: '🟡', MANUEL: '✍️',
};

export default function PaiementsPage() {
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = PAIEMENTS.filter(p => filtreStatut === 'Tous' || p.statut === filtreStatut);
  const detail = PAIEMENTS.find(p => p.id === selected);

  const totalReussis = PAIEMENTS.filter(p => p.statut === 'REUSSI').reduce((s, p) => s + (p.devise === 'XOF' ? p.montant : 0), 0);
  const enAttente = PAIEMENTS.filter(p => p.statut === 'EN_ATTENTE').reduce((s, p) => s + (p.devise === 'XOF' ? p.montant : 0), 0);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text-main">Paiements & Facturation</h1>
        <p className="text-sm text-text-muted">Suivi des transactions et abonnements</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Encaissé (XOF)', val: formatMontant(totalReussis), c: '#009E00' },
          { label: 'En attente', val: formatMontant(enAttente), c: '#f59e0b' },
          { label: 'Échecs', val: PAIEMENTS.filter(p => p.statut === 'ECHEC').length, c: '#E60000' },
          { label: 'Remboursés', val: PAIEMENTS.filter(p => p.statut === 'REMBOURSE').length, c: '#6b7280' },
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
            {s === 'Tous' ? 'Tous' : STATUT_MAP[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-white/5 rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50 dark:bg-white/3">
                {['Référence', 'Client', 'Montant', 'Provider', 'Plan', 'Période', 'Statut', 'Date', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-white/3 cursor-pointer" onClick={() => setSelected(p.id)}>
                  <td className="px-4 py-3 font-mono text-xs text-brand-green font-bold">{p.reference}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-text-main">{p.tenant}</p>
                    <p className="text-xs text-text-muted">{p.email}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums font-bold text-text-main">
                    {formatMontant(p.montant)} <span className="text-xs text-text-muted">{p.devise}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                      <span>{PROVIDER_ICON[p.provider]}</span>{p.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-purple-600 dark:text-purple-300">{p.plan}</td>
                  <td className="px-4 py-3 text-xs text-text-muted">{p.periode}</td>
                  <td className="px-4 py-3"><Badge couleur={STATUT_MAP[p.statut]?.couleur ?? 'neutral'}>{STATUT_MAP[p.statut]?.label}</Badge></td>
                  <td className="px-4 py-3 text-xs text-text-muted">{formatRelativeTime(p.date)}</td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-brand-green hover:underline font-semibold">Voir</button>
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
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-xs font-mono text-brand-green">{detail.reference}</p>
                <h2 className="text-xl font-black text-text-main">{detail.tenant}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-text-muted text-xl">✕</button>
            </div>
            <div className="text-center py-6 mb-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
              <p className="text-4xl font-black tabular-nums text-text-main">{formatMontant(detail.montant)}</p>
              <p className="text-sm text-text-muted">{detail.devise} · {detail.plan}</p>
              <div className="mt-3"><Badge couleur={STATUT_MAP[detail.statut]?.couleur ?? 'neutral'}>{STATUT_MAP[detail.statut]?.label}</Badge></div>
            </div>
            <div className="space-y-2 text-sm mb-4">
              {[
                ['Provider', `${PROVIDER_ICON[detail.provider]} ${detail.provider}`],
                ['Période', detail.periode],
                ['Date', new Date(detail.date).toLocaleString('fr-FR')],
                ['Email', detail.email],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-border last:border-0">
                  <span className="text-text-muted">{k}</span>
                  <span className="font-semibold text-text-main">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-text-muted hover:bg-gray-50 dark:hover:bg-white/5">📥 Reçu PDF</button>
              {detail.statut === 'REUSSI' && <button className="px-4 py-2.5 rounded-xl border border-orange-300 text-orange-600 text-sm font-bold">↩ Rembourser</button>}
              {detail.statut === 'ECHEC' && <button className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold">🔄 Relancer</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
