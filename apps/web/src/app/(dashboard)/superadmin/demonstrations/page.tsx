'use client';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';
import {
  useDemonstrations,
  useDemoStats,
  useChangerStatutDemo,
  useCreateDemonstration,
  useCreateOffre,
} from '@/hooks/useCrm';

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
  const [toast, setToast] = useState<string | null>(null);
  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Formulaire de planification (contrôlé). L'entreprise est requise par l'API ;
  // le champ « prospect (email) » reste informatif (l'API attend un prospectId, pas un email).
  const [form, setForm] = useState({
    entreprise: '',
    prospect: '',
    date: '',
    heure: '',
    mode: 'VISIO',
  });

  // Petite modale « Créer une offre » à partir d'une démo réalisée.
  const [offreDemo, setOffreDemo] = useState<{ id: string; prospectId: string | null } | null>(null);
  const [offreForm, setOffreForm] = useState({ entreprise: '', prixHT: '', devise: 'XOF' });

  const changerStatut = useChangerStatutDemo();
  const createDemo = useCreateDemonstration();
  const createOffre = useCreateOffre();

  const params: Record<string, string> = { limit: '100' };
  if (filtreStatut !== 'Tous') params.statut = filtreStatut;

  const { data: demos = [], isLoading, isError } = useDemonstrations(params);
  const { data: stats } = useDemoStats();

  const detail = demos.find((d) => d.id === selected);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleChangerStatut = async (id: string, statut: string) => {
    try {
      await changerStatut.mutateAsync({ id, statut });
      notify(t.common?.success ?? 'OK');
      setSelected(null);
    } catch {
      notify(t.common?.error ?? 'Erreur');
    }
  };

  const handleCreateDemo = async () => {
    if (!form.entreprise.trim() || !form.date) {
      notify(t.common?.error ?? 'Champs requis manquants');
      return;
    }
    const iso = new Date(`${form.date}T${form.heure || '00:00'}`).toISOString();
    try {
      await createDemo.mutateAsync({
        entreprise: form.entreprise.trim(),
        date: iso,
        mode: form.mode,
      });
      notify(t.common?.success ?? 'OK');
      setShowForm(false);
      setForm({ entreprise: '', prospect: '', date: '', heure: '', mode: 'VISIO' });
    } catch {
      notify(t.common?.error ?? 'Erreur');
    }
  };

  const openOffre = (d: { id: string; entreprise: string; prospectId: string | null }) => {
    setOffreDemo({ id: d.id, prospectId: d.prospectId });
    setOffreForm({ entreprise: d.entreprise, prixHT: '', devise: 'XOF' });
  };

  const handleCreateOffre = async () => {
    if (!offreDemo) return;
    const prix = Number(offreForm.prixHT);
    if (!offreForm.entreprise.trim() || !offreForm.prixHT || Number.isNaN(prix)) {
      notify(t.common?.error ?? 'Champs requis manquants');
      return;
    }
    try {
      await createOffre.mutateAsync({
        entreprise: offreForm.entreprise.trim(),
        prixHT: prix,
        devise: offreForm.devise,
        demonstrationId: offreDemo.id,
        ...(offreDemo.prospectId ? { prospectId: offreDemo.prospectId } : {}),
      });
      notify(t.common?.success ?? 'OK');
      setOffreDemo(null);
      setSelected(null);
    } catch {
      notify(t.common?.error ?? 'Erreur');
    }
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
                  <button
                    onClick={() => handleChangerStatut(detail.id, 'REALISEE')}
                    disabled={changerStatut.isPending}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold disabled:opacity-60"
                  >
                    {changerStatut.isPending ? (t.common?.loading ?? '…') : t.superadmin.demos.detail.markDone}
                  </button>
                  <button
                    onClick={() => handleChangerStatut(detail.id, 'ANNULEE')}
                    disabled={changerStatut.isPending}
                    className="px-4 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-bold disabled:opacity-60"
                  >
                    {t.superadmin.demos.detail.cancel}
                  </button>
                </>
              )}
              {detail.statut === 'REALISEE' && (
                <button
                  onClick={() => openOffre(detail)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold"
                >
                  {t.superadmin.demos.detail.createOffer}
                </button>
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
              <div>
                <label className="text-xs font-bold text-text-muted block mb-1">{t.superadmin.prospects.columns.entreprise}</label>
                <input
                  type="text"
                  value={form.entreprise}
                  onChange={(e) => setForm((s) => ({ ...s, entreprise: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-white/5 text-text-main text-sm outline-none focus:border-brand-green"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted block mb-1">{t.superadmin.demos.form.prospect}</label>
                <input
                  type="email"
                  placeholder={t.superadmin.demos.form.prospectPlaceholder}
                  value={form.prospect}
                  onChange={(e) => setForm((s) => ({ ...s, prospect: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-white/5 text-text-main text-sm outline-none focus:border-brand-green"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted block mb-1">{t.superadmin.demos.form.date}</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-white/5 text-text-main text-sm outline-none focus:border-brand-green"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted block mb-1">{t.superadmin.demos.form.heure}</label>
                <input
                  type="time"
                  value={form.heure}
                  onChange={(e) => setForm((s) => ({ ...s, heure: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-white/5 text-text-main text-sm outline-none focus:border-brand-green"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted block mb-1">{t.superadmin.demos.form.mode}</label>
                <select
                  value={form.mode}
                  onChange={(e) => setForm((s) => ({ ...s, mode: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-white/5 text-text-main text-sm outline-none focus:border-brand-green"
                >
                  <option value="VISIO">{t.superadmin.demos.form.visio}</option>
                  <option value="PRESENTIEL">{t.superadmin.demos.form.presentiel}</option>
                  <option value="TELEPHONE">{t.superadmin.demos.form.telephone}</option>
                </select>
              </div>
              <button
                onClick={handleCreateDemo}
                disabled={createDemo.isPending}
                className="w-full py-3 rounded-xl bg-brand-green text-white font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {createDemo.isPending ? (t.common?.loading ?? '…') : t.superadmin.demos.form.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal création d'offre depuis une démo réalisée */}
      {offreDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOffreDemo(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <h2 className="text-xl font-black text-text-main">{t.superadmin.demos.detail.createOffer}</h2>
              <button onClick={() => setOffreDemo(null)} className="text-text-muted hover:text-text-main text-xl" aria-label={t.superadmin.demos.close}>✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-text-muted block mb-1">{t.superadmin.prospects.columns.entreprise}</label>
                <input
                  type="text"
                  value={offreForm.entreprise}
                  onChange={(e) => setOffreForm((s) => ({ ...s, entreprise: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-white/5 text-text-main text-sm outline-none focus:border-brand-green"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted block mb-1">{t.superadmin.offres.detail.prixHT}</label>
                <input
                  type="number"
                  min="0"
                  value={offreForm.prixHT}
                  onChange={(e) => setOffreForm((s) => ({ ...s, prixHT: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-white/5 text-text-main text-sm outline-none focus:border-brand-green"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted block mb-1">{t.common.currency}</label>
                <select
                  value={offreForm.devise}
                  onChange={(e) => setOffreForm((s) => ({ ...s, devise: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-white/5 text-text-main text-sm outline-none focus:border-brand-green"
                >
                  <option value="XOF">XOF</option>
                  <option value="XAF">XAF</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <button
                onClick={handleCreateOffre}
                disabled={createOffre.isPending}
                className="w-full py-3 rounded-xl bg-brand-green text-white font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {createOffre.isPending ? (t.common?.loading ?? '…') : t.common.create}
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
