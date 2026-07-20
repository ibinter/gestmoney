'use client';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

const DEMOS = [
  { id: '1', prospect: 'Mamadou Koné', entreprise: 'Orange CI', email: 'mkone@orange.ci', date: '2026-07-20', heure: '10:00', fuseau: 'Africa/Abidjan', mode: 'VISIO', statut: 'PLANIFIEE', lien: 'https://meet.google.com/abc-def-ghi', animateur: 'Jean Dupont', notes: '' },
  { id: '2', prospect: 'Fatoumata Diallo', entreprise: 'Wave SN', email: 'fdiallo@wave.com', date: '2026-07-18', heure: '14:30', fuseau: 'Africa/Dakar', mode: 'VISIO', statut: 'REALISEE', lien: '', animateur: 'Marie Martin', notes: 'Client très intéressé par le module commissions. Relance offre prévue.' },
  { id: '3', prospect: 'Ibrahim Touré', entreprise: 'Moov BJ', email: 'itoure@moov.bj', date: '2026-07-22', heure: '09:00', fuseau: 'Africa/Porto-Novo', mode: 'PRESENTIEL', statut: 'PLANIFIEE', lien: '', animateur: 'Jean Dupont', notes: 'Déplacement prévu à Cotonou.' },
  { id: '4', prospect: 'Ama Mensah', entreprise: 'Airtel KE', email: 'amensah@airtel.ke', date: '2026-07-10', heure: '11:00', fuseau: 'Africa/Nairobi', mode: 'TELEPHONE', statut: 'REALISEE', lien: '', animateur: 'Marie Martin', notes: 'Contrat signé suite à la démo.' },
  { id: '5', prospect: 'Aminata Bah', entreprise: 'FinCash ML', email: 'abah@fincash.ml', date: '2026-07-05', heure: '15:00', fuseau: 'Africa/Bamako', mode: 'VISIO', statut: 'ANNULEE', lien: '', animateur: 'Jean Dupont', notes: 'Client a annulé 1h avant.' },
];

type CouleurStatut = 'info' | 'success' | 'danger' | 'neutral';

const STATUT_COULEUR: Record<string, CouleurStatut> = {
  PLANIFIEE: 'info', REALISEE: 'success', ANNULEE: 'danger',
};

/** Libellé + couleur de statut pour la langue active. */
const statutMap = (t: Translations): Record<string, { label: string; couleur: CouleurStatut }> =>
  Object.fromEntries(
    Object.keys(STATUT_COULEUR).map((k) => [k, { label: t.superadmin.demos.statuts[k as keyof typeof t.superadmin.demos.statuts], couleur: STATUT_COULEUR[k] }]),
  );

const modeMap = (t: Translations): Record<string, string> => t.superadmin.demos.modes;

export default function DemonstrationsPage() {
  const t = useT();
  const STATUT_MAP = statutMap(t);
  const MODE_MAP = modeMap(t);
  const [filtreStatut, setFiltreStatut] = useState('Tous');
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = DEMOS.filter(d => filtreStatut === 'Tous' || d.statut === filtreStatut);
  const detail = DEMOS.find(d => d.id === selected);

  const stats = {
    total: DEMOS.length,
    planifiees: DEMOS.filter(d => d.statut === 'PLANIFIEE').length,
    realisees: DEMOS.filter(d => d.statut === 'REALISEE').length,
    annulees: DEMOS.filter(d => d.statut === 'ANNULEE').length,
    tauxRealisation: Math.round(DEMOS.filter(d => d.statut === 'REALISEE').length / DEMOS.filter(d => d.statut !== 'PLANIFIEE').length * 100) || 0,
  };

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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: t.superadmin.demos.kpi.total, val: stats.total, c: '#6366f1' },
          { label: t.superadmin.demos.kpi.planifiees, val: stats.planifiees, c: '#0ea5e9' },
          { label: t.superadmin.demos.kpi.realisees, val: stats.realisees, c: '#009E00' },
          { label: t.superadmin.demos.kpi.annulees, val: stats.annulees, c: '#E60000' },
          { label: t.superadmin.demos.kpi.tauxReal, val: stats.tauxRealisation + '%', c: '#FFD000' },
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-border">
            <p className="text-xs text-text-muted font-semibold uppercase tracking-wide">{k.label}</p>
            <p className="text-2xl font-black mt-1" style={{ color: k.c }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 flex-wrap mb-4">
        {['Tous', 'PLANIFIEE', 'REALISEE', 'ANNULEE'].map(s => (
          <button key={s} onClick={() => setFiltreStatut(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${filtreStatut === s ? 'bg-brand-green text-white border-brand-green' : 'bg-white dark:bg-white/5 text-text-muted border-border hover:border-brand-green'}`}>
            {s === 'Tous' ? t.superadmin.demos.all : STATUT_MAP[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(d => (
          <div key={d.id} onClick={() => setSelected(d.id)}
            className="bg-white dark:bg-white/5 rounded-2xl border border-border p-5 cursor-pointer hover:border-brand-green transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-text-main">{d.prospect}</p>
                <p className="text-xs text-text-muted">{d.entreprise}</p>
              </div>
              <Badge couleur={STATUT_MAP[d.statut]?.couleur ?? 'neutral'}>{STATUT_MAP[d.statut]?.label}</Badge>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-text-muted">
                <span>📅</span><span>{d.date} {t.superadmin.demos.at} {d.heure}</span>
              </div>
              <div className="flex items-center gap-2 text-text-muted">
                <span>{MODE_MAP[d.mode]?.split(' ')[0]}</span>
                <span>{MODE_MAP[d.mode]?.split(' ').slice(1).join(' ')}</span>
              </div>
              <div className="flex items-center gap-2 text-text-muted">
                <span>👤</span><span>{d.animateur}</span>
              </div>
              {d.notes && (
                <p className="text-xs text-text-muted mt-2 border-t border-border pt-2 line-clamp-2">{d.notes}</p>
              )}
            </div>
            {d.statut === 'PLANIFIEE' && d.lien && (
              <a href={d.lien} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                className="mt-3 flex items-center gap-1.5 text-xs font-bold text-brand-green hover:underline">
                {t.superadmin.demos.join}
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Modal détail */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-black text-text-main">{detail.prospect}</h2>
                <p className="text-sm text-text-muted">{detail.entreprise}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-text-muted hover:text-text-main text-xl" aria-label={t.superadmin.demos.close}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                [t.superadmin.demos.detail.date, `${detail.date} ${detail.heure}`],
                [t.superadmin.demos.detail.mode, MODE_MAP[detail.mode]],
                [t.superadmin.demos.detail.fuseau, detail.fuseau],
                [t.superadmin.demos.detail.animateur, detail.animateur],
                [t.superadmin.demos.detail.statut, STATUT_MAP[detail.statut]?.label],
                [t.superadmin.demos.detail.email, detail.email],
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
                  <button className="flex-1 px-4 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold">{t.superadmin.demos.detail.markDone}</button>
                  <button className="px-4 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-bold">{t.superadmin.demos.detail.cancel}</button>
                </>
              )}
              {detail.statut === 'REALISEE' && (
                <button className="flex-1 px-4 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold">{t.superadmin.demos.detail.createOffer}</button>
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
              <button className="w-full py-3 rounded-xl bg-brand-green text-white font-bold text-sm hover:bg-green-700 transition-colors">
                {t.superadmin.demos.form.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
