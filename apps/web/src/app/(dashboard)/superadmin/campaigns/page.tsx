'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Plus,
  Eye,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  X,
  Users,
  BarChart2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { clsx } from 'clsx';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatutCampagne = 'BROUILLON' | 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE';
type CibleCampagne = 'PROSPECTS' | 'EXPIRATION_7J' | 'EXPIRATION_30J' | 'SUSPENDUS' | 'TOUS_ADMINS';

interface Campagne {
  id: string;
  nom: string;
  sujet: string;
  cible: CibleCampagne;
  statut: StatutCampagne;
  planifieeA?: string | null;
  envoyeeA?: string | null;
  nbDestinat: number;
  nbEnvois: number;
  nbErreurs: number;
  createdAt: string;
}

// ─── Constantes UI ────────────────────────────────────────────────────────────

const CIBLES: { value: CibleCampagne; label: string; desc: string }[] = [
  { value: 'PROSPECTS', label: 'Prospects non convertis', desc: 'Tous les prospects en pipeline' },
  { value: 'EXPIRATION_7J', label: 'Expiration ≤ 7 jours', desc: 'Abonnements qui expirent dans 7 j' },
  { value: 'EXPIRATION_30J', label: 'Expiration 8-30 jours', desc: 'Abonnements qui expirent dans 30 j' },
  { value: 'SUSPENDUS', label: 'Comptes suspendus', desc: 'Suspendus depuis ≤ 90 jours' },
  { value: 'TOUS_ADMINS', label: 'Tous les admins réseau', desc: 'Utilisateurs NETWORK_ADMIN actifs' },
];

const STATUT_CONFIG: Record<StatutCampagne, { label: string; color: string; icon: React.ReactNode }> = {
  BROUILLON: {
    label: 'Brouillon',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    icon: <Clock size={12} />,
  },
  PLANIFIEE: {
    label: 'Planifiée',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    icon: <Clock size={12} />,
  },
  EN_COURS: {
    label: 'En cours',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    icon: <Send size={12} />,
  },
  TERMINEE: {
    label: 'Terminée',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    icon: <CheckCircle2 size={12} />,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tauxLivraison(c: Campagne): string {
  if (c.nbDestinat === 0) return '—';
  return `${((c.nbEnvois / c.nbDestinat) * 100).toFixed(1)}%`;
}

function labelCible(cible: CibleCampagne) {
  return CIBLES.find((c) => c.value === cible)?.label ?? cible;
}

// ─── Modal Nouvelle Campagne ──────────────────────────────────────────────────

function ModalNouvelleCampagne({
  onFermer,
  onCreee,
}: {
  onFermer: () => void;
  onCreee: () => void;
}) {
  const [nom, setNom] = useState('');
  const [sujet, setSujet] = useState('');
  const [corps, setCorps] = useState('');
  const [cible, setCible] = useState<CibleCampagne>('PROSPECTS');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !sujet.trim() || !corps.trim()) {
      setErreur('Tous les champs obligatoires doivent être remplis.');
      return;
    }
    setLoading(true);
    setErreur('');
    try {
      await api.post('/campaigns', { nom, sujet, corps, cible, planifieeA: date || undefined });
      onCreee();
    } catch (err: any) {
      setErreur(err.response?.data?.message ?? err.message ?? 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <h2 className="text-sm font-bold text-text-main">Nouvelle campagne email</h2>
          <button onClick={onFermer} className="text-text-muted hover:text-text-main"><X size={18} /></button>
        </div>
        <form onSubmit={soumettre} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Nom de la campagne *</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-white dark:bg-white/05 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Relance prospects juillet 2026"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Sujet de l'email *</label>
            <input
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-white dark:bg-white/05 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: GESTMONEY — votre essai gratuit vous attend"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Corps du message (HTML) *</label>
            <textarea
              value={corps}
              onChange={(e) => setCorps(e.target.value)}
              rows={5}
              className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-white dark:bg-white/05 text-text-main focus:outline-none focus:ring-2 focus:ring-primary resize-y font-mono"
              placeholder="<p>Bonjour,</p><p>Votre abonnement expire bientôt...</p>"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Cible *</label>
            <select
              value={cible}
              onChange={(e) => setCible(e.target.value as CibleCampagne)}
              className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CIBLES.map((c) => (
                <option key={c.value} value={c.value}>{c.label} — {c.desc}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Date d'envoi planifiée (optionnel)</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {erreur && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertTriangle size={12} /> {erreur}
            </p>
          )}
          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={onFermer} className="flex-1 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-text-muted hover:text-text-main transition-colors">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-sidebar rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Création…' : 'Créer la campagne'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Prévisualisation ───────────────────────────────────────────────────

function ModalPrevisualisation({
  campagneId,
  onFermer,
}: {
  campagneId: string;
  onFermer: () => void;
}) {
  const [data, setData] = useState<{ count: number; exemples: { email: string; nom?: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/campaigns/${campagneId}/previsualiser`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [campagneId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
            <Users size={16} /> Prévisualisation des destinataires
          </h2>
          <button onClick={onFermer} className="text-text-muted hover:text-text-main"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">
          {loading ? (
            <p className="text-sm text-text-muted">Chargement…</p>
          ) : data ? (
            <>
              <div className="text-center mb-5">
                <p className="text-4xl font-black text-text-main">{data.count}</p>
                <p className="text-xs text-text-muted mt-1">destinataire{data.count > 1 ? 's' : ''} estimé{data.count > 1 ? 's' : ''}</p>
              </div>
              {data.exemples.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Exemples</p>
                  {data.exemples.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-white/05 rounded-xl px-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                        {(d.nom ?? d.email)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        {d.nom && <p className="text-xs font-semibold text-text-main truncate">{d.nom}</p>}
                        <p className="text-xs text-text-muted truncate">{d.email}</p>
                      </div>
                    </div>
                  ))}
                  {data.count > data.exemples.length && (
                    <p className="text-xs text-text-muted text-center">
                      … et {data.count - data.exemples.length} autre{data.count - data.exemples.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-red-500">Erreur lors du chargement</p>
          )}
        </div>
        <div className="px-6 pb-5">
          <button onClick={onFermer} className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-text-muted hover:text-text-main transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Carte Campagne ───────────────────────────────────────────────────────────

function CarteCampagne({
  campagne,
  onActualiser,
  onPrevisualiser,
}: {
  campagne: Campagne;
  onActualiser: () => void;
  onPrevisualiser: (id: string) => void;
}) {
  const [envoi, setEnvoi] = useState(false);
  const cfg = STATUT_CONFIG[campagne.statut];

  const envoyer = async () => {
    if (!confirm(`Envoyer la campagne "${campagne.nom}" maintenant ?`)) return;
    setEnvoi(true);
    try {
      await api.post(`/campaigns/${campagne.id}/envoyer`);
      onActualiser();
    } finally {
      setEnvoi(false);
    }
  };

  const peutEnvoyer = ['BROUILLON', 'PLANIFIEE'].includes(campagne.statut);

  return (
    <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 p-5 flex flex-col gap-4">
      {/* En-tête */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={clsx('flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full', cfg.color)}>
              {cfg.icon} {cfg.label}
            </span>
            <span className="text-[11px] text-text-muted bg-gray-100 dark:bg-white/08 px-2 py-0.5 rounded-full">
              {labelCible(campagne.cible)}
            </span>
          </div>
          <h3 className="text-sm font-bold text-text-main truncate">{campagne.nom}</h3>
          <p className="text-xs text-text-muted truncate mt-0.5">{campagne.sujet}</p>
        </div>
      </div>

      {/* Stats (campagnes terminées) */}
      {campagne.statut === 'TERMINEE' && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Destinataires', val: campagne.nbDestinat },
              { label: 'Envoyés', val: campagne.nbEnvois },
              { label: 'Erreurs', val: campagne.nbErreurs },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 dark:bg-white/04 rounded-xl px-3 py-2 text-center">
                <p className="text-lg font-black text-text-main">{s.val}</p>
                <p className="text-[10px] text-text-muted">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <BarChart2 size={12} />
            <span>Taux de livraison : <strong className="text-text-main">{tauxLivraison(campagne)}</strong></span>
            {campagne.envoyeeA && (
              <span className="ml-auto">{new Date(campagne.envoyeeA).toLocaleDateString('fr-FR')}</span>
            )}
          </div>
        </>
      )}

      {campagne.statut === 'PLANIFIEE' && campagne.planifieeA && (
        <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
          <Clock size={12} />
          Planifiée le {new Date(campagne.planifieeA).toLocaleString('fr-FR')}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-gray-100 dark:border-white/06 pt-3">
        <button
          onClick={() => onPrevisualiser(campagne.id)}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <Eye size={13} /> Prévisualiser
        </button>
        {peutEnvoyer && (
          <>
            <span className="text-gray-200 dark:text-white/10">|</span>
            <button
              onClick={envoyer}
              disabled={envoi}
              className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              <Send size={13} /> {envoi ? 'Envoi…' : 'Envoyer maintenant'}
            </button>
          </>
        )}
        <span className="ml-auto text-[10px] text-text-muted">
          {new Date(campagne.createdAt).toLocaleDateString('fr-FR')}
        </span>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalCreation, setModalCreation] = useState(false);
  const [prevId, setPrevId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') router.replace('/dashboard');
  }, [user, router]);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/campaigns?limit=50');
      setCampagnes(data.data ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  if (user?.role !== 'SUPER_ADMIN') return null;

  const stats = {
    total,
    terminee: campagnes.filter((c) => c.statut === 'TERMINEE').length,
    planifiee: campagnes.filter((c) => c.statut === 'PLANIFIEE').length,
    envoye: campagnes.reduce((s, c) => s + c.nbEnvois, 0),
  };

  return (
    <div className="p-6 space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <Mail size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push('/superadmin')} className="text-sm text-text-muted hover:text-text-main transition-colors">
                SuperAdmin
              </button>
              <ChevronRight size={14} className="text-text-muted" />
              <span className="text-sm font-semibold text-text-main">Campagnes email</span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">Relance prospects & abonnés</p>
          </div>
        </div>
        <button
          onClick={() => setModalCreation(true)}
          className="flex items-center gap-2 bg-primary text-sidebar text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} /> Nouvelle campagne
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total campagnes', valeur: stats.total, couleur: '#3B82F6', icone: <Mail size={16} /> },
          { label: 'Terminées', valeur: stats.terminee, couleur: '#10B981', icone: <CheckCircle2 size={16} /> },
          { label: 'Planifiées', valeur: stats.planifiee, couleur: '#8B5CF6', icone: <Clock size={16} /> },
          { label: 'Emails envoyés', valeur: stats.envoye.toLocaleString('fr-FR'), couleur: '#F59E0B', icone: <Send size={16} /> },
        ].map((k) => (
          <div key={k.label} className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: k.couleur + '18' }}>
              <span style={{ color: k.couleur }}>{k.icone}</span>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium uppercase tracking-wide">{k.label}</p>
              <p className="text-2xl font-black text-text-main mt-0.5">{k.valeur}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-16 text-text-muted text-sm">Chargement des campagnes…</div>
      ) : campagnes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-white/03 rounded-2xl border border-dashed border-gray-200 dark:border-white/08">
          <Mail size={32} className="mx-auto text-text-muted mb-3 opacity-30" />
          <p className="text-sm font-semibold text-text-muted">Aucune campagne</p>
          <p className="text-xs text-text-muted mt-1">Créez votre première campagne email de relance</p>
          <button
            onClick={() => setModalCreation(true)}
            className="mt-4 inline-flex items-center gap-2 bg-primary text-sidebar text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} /> Nouvelle campagne
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campagnes.map((c) => (
            <CarteCampagne
              key={c.id}
              campagne={c}
              onActualiser={charger}
              onPrevisualiser={(id) => setPrevId(id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modalCreation && (
        <ModalNouvelleCampagne
          onFermer={() => setModalCreation(false)}
          onCreee={() => { setModalCreation(false); charger(); }}
        />
      )}
      {prevId && (
        <ModalPrevisualisation
          campagneId={prevId}
          onFermer={() => setPrevId(null)}
        />
      )}
    </div>
  );
}
